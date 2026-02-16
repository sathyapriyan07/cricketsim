import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { createCompetitionState } from "../competition/competitionEngine.js";
import { requireAdmin, requireAuth, requireSuperAdmin } from "../middleware/authGuard.js";

export const competitionsRouter = Router();

competitionsRouter.get("/", async (req, res) => {
  const type = req.query.type ? String(req.query.type).toLowerCase() : null;

  let query = supabase.from("competitions").select("*").order("created_at", { ascending: false });
  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

competitionsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase.from("competitions").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

competitionsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const type = String(req.body.type || "").toLowerCase();
    const name = String(req.body.name || "").trim();
    const format = String(req.body.format || "T20").toUpperCase();
    const teamIds = Array.isArray(req.body.team_ids) ? req.body.team_ids : [];
    const startDate = req.body.startDate || new Date().toISOString();
    const seriesLength = Number(req.body.seriesLength || 3);

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!["tournament", "series", "league"].includes(type)) {
      return res.status(400).json({ error: "type must be tournament, series, or league" });
    }
    if (type === "series" && teamIds.length !== 2) {
      return res.status(400).json({ error: "Series requires exactly 2 teams" });
    }
    if (type === "league" && teamIds.length < 3) {
      return res.status(400).json({ error: "League requires at least 3 teams" });
    }
    if (type === "tournament" && teamIds.length < 2) {
      return res.status(400).json({ error: "Tournament requires at least 2 teams" });
    }

    const { data: teams, error: teamError } = await supabase.from("teams").select("id, name").in("id", teamIds);
    if (teamError) return res.status(400).json({ error: teamError.message });

    const payload = createCompetitionState({
      name,
      type,
      format,
      teamIds,
      teams: teams || [],
      createdBy: req.user.id,
      startDate,
      seriesLength
    });

    const { data, error } = await supabase.from("competitions").insert(payload).select("*").single();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to create competition" });
  }
});

competitionsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const payload = {
    ...(req.body.name ? { name: String(req.body.name).trim() } : {}),
    ...(req.body.type ? { type: String(req.body.type).toLowerCase() } : {}),
    ...(req.body.format ? { format: String(req.body.format).toUpperCase() } : {}),
    ...(Array.isArray(req.body.team_ids) ? { team_ids: req.body.team_ids } : {}),
    ...(req.body.schedule_json ? { schedule_json: req.body.schedule_json } : {}),
    ...(Array.isArray(req.body.fixtures_json)
      ? {
          fixtures_json: req.body.fixtures_json,
          schedule_json: req.body.fixtures_json
        }
      : {}),
    ...(Array.isArray(req.body.standings_json) ? { standings_json: req.body.standings_json } : {}),
    ...(req.body.bracket_json ? { bracket_json: req.body.bracket_json } : {}),
    ...(req.body.stats_json ? { stats_json: req.body.stats_json } : {}),
    ...(req.body.current_round !== undefined ? { current_round: req.body.current_round } : {}),
    ...(req.body.winner !== undefined ? { winner: req.body.winner } : {}),
    ...(req.body.status ? { status: req.body.status } : {})
  };

  const { data, error } = await supabase.from("competitions").update(payload).eq("id", req.params.id).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

competitionsRouter.delete("/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  const { error } = await supabase.from("competitions").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
