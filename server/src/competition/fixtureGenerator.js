import { addDays, createFixtureId } from "./competitionHelpers.js";
import { generateKnockoutBracket } from "./bracketGenerator.js";

export function generateSeriesFixtures(teamIds, seriesLength = 3, startDate) {
  const [a, b] = teamIds;
  const total = Math.max(1, Number(seriesLength || 3));
  const fixtures = [];

  for (let i = 0; i < total; i += 1) {
    fixtures.push({
      id: createFixtureId("SR"),
      round: 1,
      match_no: i + 1,
      team_a_id: i % 2 === 0 ? a : b,
      team_b_id: i % 2 === 0 ? b : a,
      status: "upcoming",
      scheduled_at: addDays(startDate, i * 2),
      result: null,
      winner_id: null,
      auto_simulated: false
    });
  }

  return fixtures;
}

export function generateLeagueFixtures(teamIds, startDate) {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push(null);

  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const working = [...teams];
  const fixtures = [];
  let matchNo = 1;

  for (let round = 0; round < rounds; round += 1) {
    for (let i = 0; i < half; i += 1) {
      const a = working[i];
      const b = working[working.length - 1 - i];
      if (!a || !b) continue;

      fixtures.push({
        id: createFixtureId("LG"),
        round: round + 1,
        match_no: matchNo,
        team_a_id: a,
        team_b_id: b,
        status: "upcoming",
        scheduled_at: addDays(startDate, matchNo - 1),
        result: null,
        winner_id: null,
        auto_simulated: false
      });

      matchNo += 1;
    }

    const fixed = working[0];
    const rotating = working.slice(1);
    rotating.unshift(rotating.pop());
    working.splice(0, working.length, fixed, ...rotating);
  }

  return fixtures;
}

export function generateTournamentFixtures(teamIds, startDate) {
  const bracket = generateKnockoutBracket(teamIds, startDate);
  return {
    fixtures: bracket.fixtures,
    bracket
  };
}

export function generateFixturesByType({ type, teamIds, seriesLength, startDate }) {
  if (type === "series") {
    return {
      fixtures: generateSeriesFixtures(teamIds, seriesLength, startDate),
      bracket: null
    };
  }

  if (type === "league") {
    return {
      fixtures: generateLeagueFixtures(teamIds, startDate),
      bracket: null
    };
  }

  return generateTournamentFixtures(teamIds, startDate);
}
