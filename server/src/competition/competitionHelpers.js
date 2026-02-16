import { nanoid } from "nanoid";

export function addDays(startDate, offset) {
  const base = new Date(startDate || Date.now());
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString();
}

export function createFixtureId(prefix = "FX") {
  return `${prefix}_${nanoid(8)}`;
}

export function createMatchRecordFromResult({ fixture, result, competition, teamNameMap }) {
  const teamAName = teamNameMap[fixture.team_a_id] || fixture.team_a_id;
  const teamBName = teamNameMap[fixture.team_b_id] || fixture.team_b_id;
  return {
    external_ref: fixture.id,
    team_a: teamAName,
    team_b: teamBName,
    result: result.resultText,
    scorecard_json: {
      ...result.summary,
      competitionId: competition.id,
      fixtureId: fixture.id,
      format: competition.format,
      type: competition.type
    },
    commentary_json: result.events || [],
    pitch_type: result.pitchType || "balanced",
    weather: result.weather || "clear",
    completed_at: new Date().toISOString()
  };
}

export function buildTeamNameMap(teams = []) {
  return Object.fromEntries((teams || []).map((team) => [team.id, team.name]));
}

export function normalizeCompetition(competition) {
  return {
    ...competition,
    team_ids: Array.isArray(competition.team_ids) ? competition.team_ids : [],
    fixtures_json: Array.isArray(competition.fixtures_json) ? competition.fixtures_json : [],
    standings_json: Array.isArray(competition.standings_json) ? competition.standings_json : [],
    bracket_json: competition.bracket_json || null,
    stats_json: competition.stats_json || {}
  };
}

export function sortStandings(standings = []) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return String(a.team).localeCompare(String(b.team));
  });
}

export function oversToNumber(oversLike) {
  if (typeof oversLike === "number") return oversLike;
  const text = String(oversLike || "0");
  if (!text.includes(".")) return Number(text) || 0;
  const [whole, part] = text.split(".");
  return Number(whole || 0) + Number(part || 0) / 6;
}

export function listPlayedFixtures(fixtures = []) {
  return fixtures.filter((fixture) => fixture.status === "completed").map((fixture) => fixture.id);
}

export function nextFixtureId(fixtures = []) {
  return fixtures.find((fixture) => fixture.status === "upcoming")?.id || null;
}
