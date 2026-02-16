import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateKnockoutBracket, generateRoundRobinSchedule, generateSeriesSchedule } from "../services/tournamentService.js";

export const tournamentsRouter = Router();

tournamentsRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

tournamentsRouter.post("/generate-schedule", requireAuth, requireRole("ADMIN", "MODERATOR"), async (req, res) => {
  try {
    const format = String(req.body.format || "league").toLowerCase();
    const name = String(req.body.name || "New Tournament").trim();
    const teamIds = Array.isArray(req.body.teamIds) ? req.body.teamIds : [];
    const startDate = req.body.startDate || new Date().toISOString();
    const seriesLength = Number(req.body.seriesLength || 3);

    if (!teamIds.length) {
      return res.status(400).json({ error: "teamIds is required" });
    }

    const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name").in("id", teamIds);
    if (teamsError) return res.status(400).json({ error: teamsError.message });

    const teamNames = Object.fromEntries((teams || []).map((team) => [team.id, team.name]));

    let generated;
    if (format === "league") {
      generated = generateRoundRobinSchedule(teamIds, teamNames, startDate);
    } else if (format === "series") {
      generated = generateSeriesSchedule(teamIds, teamNames, startDate, seriesLength);
    } else {
      generated = generateKnockoutBracket(teamIds, teamNames, startDate);
    }

    const payload = {
      name,
      format,
      teams: teamIds,
      standings_json: generated.standings,
      schedule_json: generated.schedule,
      bracket_json: generated.bracket,
      results_timeline_json: []
    };

    const { data, error } = await supabase.from("tournaments").insert(payload).select("*").single();
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to generate schedule" });
  }
});

tournamentsRouter.get("/:id/schedule", async (req, res) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, format, schedule_json, bracket_json, standings_json")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});
