import { Router } from "express";
import { nanoid } from "nanoid";
import { supabase } from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { buildScorecard } from "../scorecard/scorecardBuilder.js";
import { simulateBallByBall, simulateOver } from "../simulation/engine.js";
import { runPostMatchUpdates } from "../simulation/statUpdater.js";

export const matchesRouter = Router();

function extractRatings(player, type) {
  if (!player) return {};

  const fromColumns = {
    bat_power: player.bat_power,
    bat_timing: player.bat_timing,
    bat_technique: player.bat_technique,
    bat_temperament: player.bat_temperament,
    bowl_accuracy: player.bowl_accuracy,
    bowl_variation: player.bowl_variation,
    bowl_control: player.bowl_control
  };

  const careerJson = player.career_stats_json && typeof player.career_stats_json === "object" ? player.career_stats_json : {};
  const nested = careerJson.ratings && typeof careerJson.ratings === "object" ? careerJson.ratings : {};
  const merged = { ...nested, ...fromColumns };

  if (type === "bat") {
    return {
      bat_power: merged.bat_power,
      bat_timing: merged.bat_timing,
      bat_technique: merged.bat_technique,
      bat_temperament: merged.bat_temperament
    };
  }

  return {
    bowl_accuracy: merged.bowl_accuracy,
    bowl_variation: merged.bowl_variation,
    bowl_control: merged.bowl_control
  };
}

matchesRouter.post("/simulate-match", async (req, res) => {
  try {
    const mode = req.body.mode || "ball";
    const competitionId = req.body.competitionId || null;
    const teamId = req.body.teamId || null;
    const format = req.body.format || "T20";

    let batterRatings = req.body.batsmanRatings || {};
    let bowlerRatings = req.body.bowlerRatings || {};

    if ((!Object.keys(batterRatings).length && req.body.batterId) || (!Object.keys(bowlerRatings).length && req.body.bowlerId)) {
      const ids = [req.body.batterId, req.body.bowlerId].filter(Boolean);
      if (ids.length) {
        const { data: ratingPlayers } = await supabase
          .from("players")
          .select("id, career_stats_json, bat_power, bat_timing, bat_technique, bat_temperament, bowl_accuracy, bowl_variation, bowl_control")
          .in("id", ids);

        const batter = ratingPlayers?.find((entry) => entry.id === req.body.batterId);
        const bowler = ratingPlayers?.find((entry) => entry.id === req.body.bowlerId);

        if (!Object.keys(batterRatings).length) batterRatings = extractRatings(batter, "bat");
        if (!Object.keys(bowlerRatings).length) bowlerRatings = extractRatings(bowler, "bowl");
      }
    }

    const simulationInput = {
      action: req.body.action || "rotate",
      pitchType: req.body.pitchType || "balanced",
      weather: req.body.weather || "clear",
      fatigue: Number(req.body.fatigue || 10),
      skill: Number(req.body.skill || 74),
      bowlerSkill: Number(req.body.bowlerSkill || 71),
      difficulty: req.body.difficulty || "normal",
      batsmanRatings: batterRatings,
      bowlerRatings: bowlerRatings,
      batsmanId: req.body.batterId || null,
      bowlerId: req.body.bowlerId || null,
      batsmanName: req.body.batsmanName || req.body.batterName || "Batsman",
      bowlerName: req.body.bowlerName || "Bowler",
      seed: req.body.seed
    };

    if (mode === "ball") {
      const result = simulateBallByBall({
        ...simulationInput,
        state: req.body.state || { runs: 0, wickets: 0, balls: 0 }
      });

      return res.json({ event: result.event, state: result.state });
    }

    const result = simulateOver({
      ...simulationInput,
      balls: Number(req.body.balls || 6),
      state: req.body.state || { runs: 0, wickets: 0, balls: 0 }
    });

    const matchResult = `${req.body.teamA || "Team A"} ${result.summary.runs}/${result.summary.wickets}`;
    const scorecard = buildScorecard({
      events: result.events,
      result: matchResult,
      format,
      teams: [req.body.teamA || "Team A", req.body.teamB || "Team B"],
      venue: req.body.venue || null
    });

    const matchRecord = {
      external_ref: nanoid(),
      team_a: req.body.teamA || "Team A",
      team_b: req.body.teamB || "Team B",
      result: matchResult,
      scorecard_json: scorecard,
      commentary_json: result.events,
      pitch_type: simulationInput.pitchType,
      weather: simulationInput.weather,
      completed_at: new Date().toISOString()
    };

    await runPostMatchUpdates({
      batterId: req.body.batterId,
      bowlerId: req.body.bowlerId,
      events: result.events,
      matchRecord,
      format
    });

    return res.json({ events: result.events, summary: result.summary, state: result.state, scorecard });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Simulation failed" });
  }
});

matchesRouter.get("/match/:id/scorecard", async (req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select("id, scorecard_json, commentary_json, team_a, team_b, result")
    .eq("id", req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });

  let scorecard = data.scorecard_json;
  if (!scorecard || !Array.isArray(scorecard.innings)) {
    scorecard = buildScorecard({
      events: data.commentary_json || [],
      result: data.result || "",
      teams: [data.team_a, data.team_b]
    });
  }

  return res.json({ matchId: data.id, scorecard });
});

matchesRouter.post("/match/:id/scorecard", requireAuth, async (req, res) => {
  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("id, commentary_json, team_a, team_b, result, scorecard_json")
    .eq("id", req.params.id)
    .single();
  if (fetchError) return res.status(404).json({ error: fetchError.message });

  const scorecard = buildScorecard({
    events: req.body.events || existing.commentary_json || [],
    result: req.body.result || existing.result || "",
    format: req.body.format || existing.scorecard_json?.format || "T20",
    teams: req.body.teams || [existing.team_a, existing.team_b],
    venue: req.body.venue || existing.scorecard_json?.venue || null
  });

  const { data, error } = await supabase
    .from("matches")
    .update({ scorecard_json: scorecard, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select("id, scorecard_json")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ matchId: data.id, scorecard: data.scorecard_json });
});

