import { supabase } from "../config/supabase.js";

export async function listRankings() {
  return supabase.from("rankings").select("*").order("points", { ascending: false });
}

function calcPoints(player) {
  const recent = player.recent_form_json || [];
  const lastTen = recent.slice(-10);
  const avgRecent = lastTen.length ? lastTen.reduce((a, b) => a + b, 0) / lastTen.length : 0;

  const batting = player.batting_stats_json || {};
  const bowling = player.bowling_stats_json || {};

  const strikeRate = Number(batting.strikeRate || batting.sr || 0);
  const wickets = Number(bowling.wickets || bowling.w || 0);
  const consistency = Number(player.consistency_score || 50);

  return Math.round(avgRecent * 0.45 + strikeRate * 0.2 + wickets * 1.8 + consistency * 0.35);
}

export async function refreshRankings() {
  const { data: players, error } = await supabase
    .from("players")
    .select("id, role, batting_stats_json, bowling_stats_json, recent_form_json, consistency_score");
  if (error) throw error;

  const rows = [];
  for (const player of players || []) {
    let category = "ALL_ROUNDER";
    if (player.role === "BAT") category = "BATSMAN";
    if (player.role === "BOWL") category = "BOWLER";

    rows.push({
      category,
      player_id: player.id,
      points: calcPoints(player),
      updated_at: new Date().toISOString()
    });
  }

  if (rows.length) {
    const { error: upsertError } = await supabase
      .from("rankings")
      .upsert(rows, { onConflict: "category,player_id" });
    if (upsertError) throw upsertError;
  }

  return rows;
}

