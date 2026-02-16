import { supabase } from "../config/supabase.js";

export async function listPlayers() {
  return supabase.from("players").select("*").order("name");
}

export async function createPlayer(input = {}) {
  const payload = {
    name: input.name,
    role: input.role,
    image_url: input.image_url || null,
    batting_stats_json: input.batting_stats_json || {},
    bowling_stats_json: input.bowling_stats_json || {},
    fielding_stats_json: input.fielding_stats_json || {},
    career_stats_json: input.career_stats_json || {}
  };
  return supabase.from("players").insert(payload).select("*").single();
}

export async function updatePlayer(playerId, patch = {}) {
  return supabase.from("players").update(patch).eq("id", playerId).select("*").single();
}

export async function deletePlayer(playerId) {
  return supabase.from("players").delete().eq("id", playerId);
}

