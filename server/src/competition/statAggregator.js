import { listPlayedFixtures, nextFixtureId } from "./competitionHelpers.js";

function updateLeader(list = {}, playerId, delta) {
  if (!playerId) return list;
  return {
    ...list,
    [playerId]: (list[playerId] || 0) + delta
  };
}

function topLeader(map = {}) {
  const rows = Object.entries(map);
  if (!rows.length) return null;
  rows.sort((a, b) => Number(b[1]) - Number(a[1]));
  return {
    id: rows[0][0],
    value: Number(rows[0][1])
  };
}

export function aggregateCompetitionStats(competition, payload = {}) {
  const prev = competition.stats_json || {};
  const events = payload.events || [];

  const runs = events.reduce((sum, event) => sum + Number(event.runs || 0), 0);
  const wickets = events.filter((event) => event.wicket).length;

  const playerRuns = updateLeader(prev.playerRuns || {}, payload.batterId, runs);
  const playerWickets = updateLeader(prev.playerWickets || {}, payload.bowlerId, wickets);

  const fixtureIds = listPlayedFixtures(competition.fixtures_json);

  return {
    ...prev,
    fixtures_played: fixtureIds,
    current_match_id: nextFixtureId(competition.fixtures_json),
    orangeCap: topLeader(playerRuns),
    purpleCap: topLeader(playerWickets),
    playerRuns,
    playerWickets,
    lastPlayedMatch: payload.fixtureId || prev.lastPlayedMatch || null,
    updated_at: new Date().toISOString()
  };
}
