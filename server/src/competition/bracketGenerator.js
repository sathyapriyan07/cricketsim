import { addDays, createFixtureId } from "./competitionHelpers.js";

function roundName(matchCount, roundIndex) {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Final";
  if (matchCount === 4) return "Quarter Final";
  return `Round ${roundIndex}`;
}

export function generateKnockoutBracket(teamIds, startDate) {
  const count = Math.max(2, teamIds.length);
  const power = 2 ** Math.ceil(Math.log2(count));
  const seeded = [...teamIds, ...Array(power - teamIds.length).fill(null)];

  const rounds = [];
  const fixtures = [];
  let participants = seeded;
  let globalMatchNo = 1;

  for (let round = 0; round < Math.log2(power); round += 1) {
    const matchCount = participants.length / 2;
    const roundMatches = [];

    for (let i = 0; i < matchCount; i += 1) {
      const fixtureId = createFixtureId("KO");
      const teamA = round === 0 ? participants[i * 2] : null;
      const teamB = round === 0 ? participants[i * 2 + 1] : null;

      const fixture = {
        id: fixtureId,
        round: round + 1,
        round_name: roundName(matchCount, round + 1),
        match_no: globalMatchNo,
        team_a_id: teamA,
        team_b_id: teamB,
        source_a: round === 0 ? null : `R${round}M${i * 2 + 1}`,
        source_b: round === 0 ? null : `R${round}M${i * 2 + 2}`,
        status: teamA && !teamB ? "completed" : "upcoming",
        winner_id: teamA && !teamB ? teamA : null,
        result: teamA && !teamB ? "Bye" : null,
        scheduled_at: addDays(startDate, globalMatchNo - 1),
        auto_simulated: true,
        bye: Boolean(teamA && !teamB)
      };

      roundMatches.push(fixture);
      fixtures.push(fixture);
      globalMatchNo += 1;
    }

    rounds.push({
      round_no: round + 1,
      round_name: roundName(matchCount, round + 1),
      matches: roundMatches.map((match) => match.id)
    });

    participants = Array(matchCount).fill("WINNER");
  }

  const fixtureIndex = Object.fromEntries(fixtures.map((fixture) => [fixture.id, fixture]));

  for (let round = 0; round < rounds.length - 1; round += 1) {
    const currentRound = rounds[round];
    const nextRound = rounds[round + 1];

    for (let i = 0; i < currentRound.matches.length; i += 1) {
      const currentFixtureId = currentRound.matches[i];
      const nextFixtureId = nextRound.matches[Math.floor(i / 2)];
      const slot = i % 2 === 0 ? "A" : "B";
      fixtureIndex[currentFixtureId].next_match_id = nextFixtureId;
      fixtureIndex[currentFixtureId].next_slot = slot;
    }
  }

  // Propagate first-round bye winners into subsequent rounds so later fixtures are playable.
  for (const fixture of fixtures) {
    if (!fixture.winner_id || !fixture.next_match_id) continue;
    const next = fixtureIndex[fixture.next_match_id];
    if (!next) continue;
    if (fixture.next_slot === "A") next.team_a_id = fixture.winner_id;
    if (fixture.next_slot === "B") next.team_b_id = fixture.winner_id;
  }

  return {
    rounds,
    fixtures
  };
}
