import { Router } from "express";
import { createCompetitionState, applyCompetitionMatchResult } from "../competition/competitionEngine.js";
import { createMatchRecordFromResult, buildTeamNameMap } from "../competition/competitionHelpers.js";
import { requireAdmin, requireAuth, requireSuperAdmin } from "../middleware/authGuard.js";
import { buildScorecard } from "../scorecard/scorecardBuilder.js";
import { simulateOver } from "../simulation/engine.js";
import { runPostMatchUpdates } from "../simulation/statUpdater.js";
import { supabase } from "../config/supabase.js";

export const competitionRouter = Router();

const ballsByFormat = {
  T20: 120,
  ODI: 300,
  TEST: 540
};

function parseRatings(careerStats = {}) {
  if (!careerStats || typeof careerStats !== "object") return {};
  const ratings = careerStats.ratings;
  return ratings && typeof ratings === "object" ? ratings : {};
}

function teamSkill(team, playersById = {}) {
  const ids = Array.isArray(team?.squad_player_ids) ? team.squad_player_ids : [];
  if (!ids.length) return 70;

  const values = ids.map((id) => {
    const player = playersById[id];
    if (!player) return 70;

    const ratings = parseRatings(player.career_stats_json);
    const bat = Number(ratings.bat_power || ratings.bat_timing || player.batting_stats_json?.strikeRate || 70);
    const bowl = Number(ratings.bowl_accuracy || ratings.bowl_control || player.bowling_stats_json?.wickets || 70);
    return (bat + bowl) / 2;
  });

  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function simulateFixtureMatch({ fixture, competition, userTeamId }) {
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("id, name, squad_player_ids")
    .in("id", [fixture.team_a_id, fixture.team_b_id]);
  if (teamError) throw teamError;

  const teamMap = Object.fromEntries((teams || []).map((team) => [team.id, team]));

  const playerIds = [...new Set((teams || []).flatMap((team) => team.squad_player_ids || []))];
  const { data: players } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, batting_stats_json, bowling_stats_json, career_stats_json")
        .in("id", playerIds)
    : { data: [] };
  const playersById = Object.fromEntries((players || []).map((player) => [player.id, player]));

  const teamA = teamMap[fixture.team_a_id];
  const teamB = teamMap[fixture.team_b_id];

  const teamASkill = teamSkill(teamA, playersById);
  const teamBSkill = teamSkill(teamB, playersById);

  const totalBalls = ballsByFormat[String(competition.format || "T20").toUpperCase()] || 120;
  const pitchType = "balanced";
  const weather = "clear";
  const userInvolved = userTeamId && [fixture.team_a_id, fixture.team_b_id].includes(userTeamId);
  const seed = `${competition.id}-${fixture.id}`;

  const inningsA = simulateOver({
    balls: totalBalls,
    state: { runs: 0, wickets: 0, balls: 0 },
    action: userInvolved && userTeamId === fixture.team_a_id ? "strike" : "rotate",
    skill: teamASkill,
    bowlerSkill: teamBSkill,
    pitchType,
    weather,
    difficulty: "normal",
    seed: `${seed}-A`
  });

  const inningsB = simulateOver({
    balls: totalBalls,
    state: { runs: 0, wickets: 0, balls: 0 },
    action: userInvolved && userTeamId === fixture.team_b_id ? "strike" : "rotate",
    skill: teamBSkill,
    bowlerSkill: teamASkill,
    pitchType,
    weather,
    difficulty: "normal",
    seed: `${seed}-B`
  });

  const teamARuns = inningsA.summary.runs;
  const teamBRuns = inningsB.summary.runs;

  let winnerId = null;
  if (teamARuns > teamBRuns) winnerId = fixture.team_a_id;
  if (teamBRuns > teamARuns) winnerId = fixture.team_b_id;

  const resultText = winnerId
    ? `${teamMap[winnerId]?.name || winnerId} won by ${Math.abs(teamARuns - teamBRuns)} runs`
    : "Match tied";

  const summary = {
    teamARuns,
    teamBRuns,
    teamAOvers: inningsA.summary.overs,
    teamBOvers: inningsB.summary.overs,
    runs: teamARuns,
    wickets: inningsA.summary.wickets,
    overs: inningsA.summary.overs
  };

  return {
    winnerId,
    resultText,
    summary,
    events: [
      ...inningsA.events.map((event) => ({ ...event, innings: 1 })),
      ...inningsB.events.map((event) => ({ ...event, innings: 2 }))
    ],
    pitchType,
    weather,
    autoSimulated: !userInvolved
  };
}

competitionRouter.get("/", async (req, res) => {
  const type = req.query.type ? String(req.query.type).toLowerCase() : null;
  let query = supabase.from("competitions").select("*").order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

competitionRouter.post("/create", requireAuth, requireAdmin, async (req, res) => {
  try {
    const type = String(req.body.type || "").toLowerCase();
    const name = String(req.body.name || "").trim();
    const format = String(req.body.format || "T20").toUpperCase();
    const teamIds = Array.isArray(req.body.team_ids) ? req.body.team_ids : [];
    const startDate = req.body.startDate || new Date().toISOString();
    const seriesLength = Number(req.body.seriesLength || 3);

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!["series", "league", "tournament"].includes(type)) {
      return res.status(400).json({ error: "type must be series, league, or tournament" });
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

    const { data: teams, error: teamsError } = await supabase.from("teams").select("id, name").in("id", teamIds);
    if (teamsError) return res.status(400).json({ error: teamsError.message });

    const state = createCompetitionState({
      name,
      type,
      format,
      teamIds,
      teams: teams || [],
      createdBy: req.user.id,
      startDate,
      seriesLength
    });

    const { data, error } = await supabase.from("competitions").insert(state).select("*").single();
    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to create competition" });
  }
});

competitionRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase.from("competitions").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

competitionRouter.get("/:id/standings", async (req, res) => {
  const { data, error } = await supabase.from("competitions").select("id, standings_json, stats_json, status, winner").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

competitionRouter.get("/:id/bracket", async (req, res) => {
  const { data, error } = await supabase.from("competitions").select("id, bracket_json, fixtures_json, current_round, winner, status").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  return res.json(data);
});

competitionRouter.post("/:id/play-match", requireAuth, async (req, res) => {
  try {
    const { data: competition, error } = await supabase.from("competitions").select("*").eq("id", req.params.id).single();
    if (error || !competition) return res.status(404).json({ error: "Competition not found" });

    const fixtureId = req.body.fixture_id || competition.stats_json?.current_match_id || competition.current_match_id || null;
    if (!fixtureId) return res.status(400).json({ error: "No fixture available to play" });

    const fixture = (competition.fixtures_json || []).find((entry) => entry.id === fixtureId);
    if (!fixture) return res.status(404).json({ error: "Fixture not found" });
    if (fixture.status === "completed") return res.status(400).json({ error: "Fixture already completed" });
    if (!fixture.team_a_id || !fixture.team_b_id) {
      return res.status(400).json({ error: "Fixture is not ready yet. Wait for prior matches to complete." });
    }

    const result = await simulateFixtureMatch({
      fixture,
      competition,
      userTeamId: req.body.user_team_id || null
    });

    const updated = applyCompetitionMatchResult(competition, {
      fixtureId,
      winnerId: result.winnerId,
      resultText: result.resultText,
      summary: result.summary,
      events: result.events,
      batterId: req.body.batterId,
      bowlerId: req.body.bowlerId
    });

    const { data: teams } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", [fixture.team_a_id, fixture.team_b_id]);

    const teamNameMap = buildTeamNameMap(teams || []);
    const matchRecord = createMatchRecordFromResult({
      fixture,
      result,
      competition,
      teamNameMap
    });
    matchRecord.scorecard_json = buildScorecard({
      events: result.events,
      result: result.resultText,
      format: competition.format,
      teams: [teamNameMap[fixture.team_a_id] || fixture.team_a_id, teamNameMap[fixture.team_b_id] || fixture.team_b_id]
    });

    await runPostMatchUpdates({
      batterId: req.body.batterId,
      bowlerId: req.body.bowlerId,
      events: result.events,
      matchRecord,
      format: competition.format
    });

    const { data: persisted, error: updateError } = await supabase
      .from("competitions")
      .update({
        fixtures_json: updated.fixtures_json,
        schedule_json: updated.fixtures_json,
        standings_json: updated.standings_json,
        bracket_json: updated.bracket_json,
        stats_json: updated.stats_json,
        current_round: updated.current_round,
        winner: updated.winner,
        status: updated.status
      })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (updateError) return res.status(400).json({ error: updateError.message });

    return res.json({
      competition: persisted,
      fixture_id: fixtureId,
      result: result.resultText,
      auto_simulated: result.autoSimulated,
      summary: result.summary
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to play fixture" });
  }
});

competitionRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const payload = {
    ...(req.body.name ? { name: String(req.body.name).trim() } : {}),
    ...(req.body.status ? { status: req.body.status } : {}),
    ...(req.body.winner !== undefined ? { winner: req.body.winner } : {}),
    ...(Array.isArray(req.body.fixtures_json) ? { fixtures_json: req.body.fixtures_json, schedule_json: req.body.fixtures_json } : {}),
    ...(Array.isArray(req.body.standings_json) ? { standings_json: req.body.standings_json } : {}),
    ...(req.body.bracket_json ? { bracket_json: req.body.bracket_json } : {}),
    ...(req.body.stats_json ? { stats_json: req.body.stats_json } : {})
  };

  const { data, error } = await supabase.from("competitions").update(payload).eq("id", req.params.id).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

competitionRouter.delete("/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  const { error } = await supabase.from("competitions").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
