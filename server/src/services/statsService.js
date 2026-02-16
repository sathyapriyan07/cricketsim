import { supabase } from "../config/supabase.js";

function applyBattingStats(prev, events) {
  const runs = events.reduce((sum, event) => sum + event.runs, 0);
  const fours = events.filter((e) => e.runs === 4).length;
  const sixes = events.filter((e) => e.runs === 6).length;
  const balls = events.filter((e) => e.outcome !== "wide" && e.outcome !== "no-ball").length || 1;

  return {
    ...prev,
    matches: Number(prev.matches || 0) + 1,
    runs: Number(prev.runs || 0) + runs,
    highScore: Math.max(Number(prev.highScore || 0), runs),
    fours: Number(prev.fours || 0) + fours,
    sixes: Number(prev.sixes || 0) + sixes,
    strikeRate: Number((((Number(prev.runs || 0) + runs) / balls) * 100).toFixed(2))
  };
}

function applyBowlingStats(prev, events) {
  const wickets = events.filter((e) => e.wicket).length;
  const balls = events.filter((e) => e.outcome !== "wide" && e.outcome !== "no-ball").length || 1;
  const runsConceded = events.reduce((sum, event) => sum + event.runs, 0);

  return {
    ...prev,
    wickets: Number(prev.wickets || 0) + wickets,
    overs: Number(prev.overs || 0) + Number((balls / 6).toFixed(1)),
    economy: Number((runsConceded / (balls / 6)).toFixed(2)),
    bestFigures: `${Math.max(wickets, Number(String(prev.bestFigures || "0/0").split("/")[0]))}/${runsConceded}`
  };
}

export async function updateStatsAfterMatch({ batterId, bowlerId, events, matchRecord }) {
  let batter = null;
  let bowler = null;

  if (batterId) {
    const batterResponse = await supabase.from("players").select("id, batting_stats_json").eq("id", batterId).single();
    batter = batterResponse.data;
  }

  if (bowlerId) {
    const bowlerResponse = await supabase.from("players").select("id, bowling_stats_json").eq("id", bowlerId).single();
    bowler = bowlerResponse.data;
  }

  if (batter?.id) {
    await supabase
      .from("players")
      .update({
        batting_stats_json: applyBattingStats(batter.batting_stats_json || {}, events),
        updated_at: new Date().toISOString()
      })
      .eq("id", batter.id);
  }

  if (bowler?.id) {
    await supabase
      .from("players")
      .update({
        bowling_stats_json: applyBowlingStats(bowler.bowling_stats_json || {}, events),
        updated_at: new Date().toISOString()
      })
      .eq("id", bowler.id);
  }

  await supabase.from("matches").insert(matchRecord);
}
