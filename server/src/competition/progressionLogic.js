import { nextFixtureId, sortStandings } from "./competitionHelpers.js";
import { updateStandings } from "./standingsCalculator.js";

function applyTournamentProgression(competition, fixture) {
  const fixtures = competition.fixtures_json.map((entry) => ({ ...entry }));
  const fixtureIndex = Object.fromEntries(fixtures.map((entry) => [entry.id, entry]));

  if (fixture.next_match_id && fixture.winner_id) {
    const next = fixtureIndex[fixture.next_match_id];
    if (next) {
      if (fixture.next_slot === "A") next.team_a_id = fixture.winner_id;
      if (fixture.next_slot === "B") next.team_b_id = fixture.winner_id;
    }
  }

  const finalFixture = fixtures.find((entry) => !entry.next_match_id && entry.status === "completed");
  const winner = finalFixture?.winner_id || null;

  return {
    ...competition,
    fixtures_json: fixtures,
    winner,
    status: winner ? "completed" : "ongoing",
    current_match_id: nextFixtureId(fixtures)
  };
}

function applySeriesProgression(competition) {
  const completed = competition.fixtures_json.filter((entry) => entry.status === "completed");
  const wins = new Map();
  for (const fixture of completed) {
    if (!fixture.winner_id) continue;
    wins.set(fixture.winner_id, (wins.get(fixture.winner_id) || 0) + 1);
  }

  const target = Math.floor(competition.fixtures_json.length / 2) + 1;
  const winner = [...wins.entries()].find(([, value]) => value >= target)?.[0] || null;

  return {
    ...competition,
    winner,
    status: winner || completed.length === competition.fixtures_json.length ? "completed" : "ongoing",
    current_match_id: nextFixtureId(competition.fixtures_json)
  };
}

function applyLeagueProgression(competition, fixture, summary) {
  const nextStandings = updateStandings(competition.standings_json, fixture, summary);
  const completed = competition.fixtures_json.filter((entry) => entry.status === "completed").length;
  const allDone = completed === competition.fixtures_json.length;
  const sorted = sortStandings(nextStandings);

  return {
    ...competition,
    standings_json: sorted,
    winner: allDone ? sorted[0]?.team_id || null : null,
    status: allDone ? "completed" : "ongoing",
    current_match_id: nextFixtureId(competition.fixtures_json)
  };
}

export function applyProgression(competition, fixture, summary = {}) {
  const fixtures = competition.fixtures_json.map((entry) =>
    entry.id === fixture.id
      ? {
          ...entry,
          status: "completed",
          winner_id: fixture.winner_id,
          result: fixture.result,
          summary
        }
      : entry
  );

  const base = {
    ...competition,
    fixtures_json: fixtures
  };

  if (competition.type === "series") {
    return applySeriesProgression(base);
  }

  if (competition.type === "league") {
    const completedFixture = fixtures.find((entry) => entry.id === fixture.id);
    return applyLeagueProgression(base, completedFixture, summary);
  }

  return applyTournamentProgression(base, fixtures.find((entry) => entry.id === fixture.id));
}
