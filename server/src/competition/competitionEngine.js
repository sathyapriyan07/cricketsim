import { buildTeamNameMap, normalizeCompetition } from "./competitionHelpers.js";
import { generateFixturesByType } from "./fixtureGenerator.js";
import { initStandings } from "./standingsCalculator.js";
import { applyProgression } from "./progressionLogic.js";
import { aggregateCompetitionStats } from "./statAggregator.js";

export function createCompetitionState({ name, type, format, teamIds, teams, createdBy, startDate, seriesLength }) {
  const { fixtures, bracket } = generateFixturesByType({
    type,
    teamIds,
    startDate,
    seriesLength
  });

  const teamNameMap = buildTeamNameMap(teams);
  const standings = type === "league" ? initStandings(teamIds, teamNameMap) : [];

  const currentMatch = fixtures.find((fixture) => fixture.status !== "completed");

  return {
    name,
    type,
    format,
    team_ids: teamIds,
    fixtures_json: fixtures,
    schedule_json: fixtures,
    standings_json: standings,
    bracket_json: bracket,
    stats_json: {
      fixtures_played: [],
      current_match_id: currentMatch?.id || null,
      playerRuns: {},
      playerWickets: {}
    },
    current_round: currentMatch?.round || 1,
    winner: null,
    status: "scheduled",
    created_by: createdBy,
    created_at: new Date().toISOString()
  };
}

export function applyCompetitionMatchResult(competitionInput, { fixtureId, winnerId, resultText, summary, events, batterId, bowlerId }) {
  const competition = normalizeCompetition(competitionInput);
  const fixture = competition.fixtures_json.find((entry) => entry.id === fixtureId);
  if (!fixture) throw new Error("Fixture not found");
  if (fixture.status === "completed") throw new Error("Fixture already completed");

  const fixtureResult = {
    ...fixture,
    winner_id: winnerId,
    result: resultText
  };

  const progressed = applyProgression(competition, fixtureResult, summary);
  const stats_json = aggregateCompetitionStats(progressed, {
    fixtureId,
    events,
    batterId,
    bowlerId
  });

  const currentRound = progressed.fixtures_json.find((entry) => entry.status === "upcoming")?.round || progressed.current_round || 1;

  return {
    ...progressed,
    stats_json,
    schedule_json: progressed.fixtures_json,
    current_round: currentRound
  };
}
