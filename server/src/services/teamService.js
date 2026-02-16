import { supabase } from "../config/supabase.js";

export async function listTeams() {
  return supabase.from("teams").select("*").order("name");
}

export async function createTeam(input = {}, userRole = "USER") {
  const payload = {
    name: input.name,
    logo_url: input.logo_url || null,
    squad_player_ids: input.squad_player_ids || [],
    approved: userRole === "ADMIN" || userRole === "MODERATOR"
  };
  return supabase.from("teams").insert(payload).select("*").single();
}

export async function updateTeam(teamId, input = {}) {
  const payload = {
    name: input.name,
    logo_url: input.logo_url ?? null,
    squad_player_ids: input.squad_player_ids || [],
    ...(typeof input.approved === "boolean" ? { approved: input.approved } : {})
  };
  return supabase.from("teams").update(payload).eq("id", teamId).select("*").single();
}

export async function approveTeam(teamId) {
  return supabase.from("teams").update({ approved: true }).eq("id", teamId).select("*").single();
}

