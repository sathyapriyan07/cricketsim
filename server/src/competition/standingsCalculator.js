import { oversToNumber, sortStandings } from "./competitionHelpers.js";

const memo = new Map();

export function initStandings(teamIds = [], teamNameMap = {}) {
  return teamIds.map((teamId) => ({
    team_id: teamId,
    team: teamNameMap[teamId] || teamId,
    matches: 0,
    wins: 0,
    losses: 0,
    points: 0,
    runScored: 0,
    oversFaced: 0,
    runsConceded: 0,
    oversBowled: 0,
    netRunRate: 0
  }));
}

function withNrr(row) {
  const scoredRate = row.oversFaced > 0 ? row.runScored / row.oversFaced : 0;
  const concededRate = row.oversBowled > 0 ? row.runsConceded / row.oversBowled : 0;
  return {
    ...row,
    netRunRate: Number((scoredRate - concededRate).toFixed(3))
  };
}

export function updateStandings(standings = [], fixture, summary = {}) {
  const key = JSON.stringify({ standings, fixture: fixture.id, summary });
  if (memo.has(key)) return memo.get(key);

  const next = standings.map((row) => ({ ...row }));
  const a = next.find((row) => row.team_id === fixture.team_a_id);
  const b = next.find((row) => row.team_id === fixture.team_b_id);
  if (!a || !b) return standings;

  const teamARuns = Number(summary.teamARuns || summary.runs || 0);
  const teamBRuns = Number(summary.teamBRuns || 0);
  const teamAOvers = oversToNumber(summary.teamAOvers || summary.overs || 20);
  const teamBOvers = oversToNumber(summary.teamBOvers || 20);

  a.matches += 1;
  b.matches += 1;

  a.runScored += teamARuns;
  b.runScored += teamBRuns;
  a.runsConceded += teamBRuns;
  b.runsConceded += teamARuns;

  a.oversFaced += teamAOvers;
  b.oversFaced += teamBOvers;
  a.oversBowled += teamBOvers;
  b.oversBowled += teamAOvers;

  if (fixture.winner_id === fixture.team_a_id) {
    a.wins += 1;
    a.points += 2;
    b.losses += 1;
  } else if (fixture.winner_id === fixture.team_b_id) {
    b.wins += 1;
    b.points += 2;
    a.losses += 1;
  } else {
    a.points += 1;
    b.points += 1;
  }

  const sorted = sortStandings(next.map(withNrr));
  memo.set(key, sorted);
  return sorted;
}
