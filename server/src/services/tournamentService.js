function addDays(startDate, offset) {
  const base = new Date(startDate || Date.now());
  base.setUTCDate(base.getUTCDate() + offset);
  return base.toISOString();
}

function roundName(matchCount, index) {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Final";
  if (matchCount === 4) return "Quarter Final";
  return `Round ${index}`;
}

export function generateRoundRobinSchedule(teamIds, teamNames, startDate) {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push(null);

  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const working = [...teams];
  const fixtures = [];

  let matchNo = 1;
  for (let r = 0; r < rounds; r += 1) {
    for (let i = 0; i < half; i += 1) {
      const a = working[i];
      const b = working[working.length - 1 - i];
      if (!a || !b) continue;

      fixtures.push({
        match_no: matchNo,
        round: r + 1,
        team_a_id: a,
        team_b_id: b,
        team_a: teamNames[a],
        team_b: teamNames[b],
        scheduled_at: addDays(startDate, matchNo - 1),
        status: "upcoming"
      });

      matchNo += 1;
    }

    const fixed = working[0];
    const rotating = working.slice(1);
    rotating.unshift(rotating.pop());
    working.splice(0, working.length, fixed, ...rotating);
  }

  const standings = teamIds.map((teamId) => ({
    team_id: teamId,
    team_name: teamNames[teamId],
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    nrr: 0
  }));

  return {
    schedule: fixtures,
    standings,
    bracket: null
  };
}

export function generateSeriesSchedule(teamIds, teamNames, startDate, seriesLength = 3) {
  const [a, b] = teamIds;
  if (!a || !b) {
    throw new Error("Series format requires at least two teams");
  }

  const schedule = [];
  for (let i = 0; i < seriesLength; i += 1) {
    schedule.push({
      match_no: i + 1,
      round: 1,
      team_a_id: i % 2 === 0 ? a : b,
      team_b_id: i % 2 === 0 ? b : a,
      team_a: i % 2 === 0 ? teamNames[a] : teamNames[b],
      team_b: i % 2 === 0 ? teamNames[b] : teamNames[a],
      scheduled_at: addDays(startDate, i * 2),
      status: "upcoming"
    });
  }

  return {
    schedule,
    standings: [
      { team_id: a, team_name: teamNames[a], wins: 0, losses: 0, ties: 0 },
      { team_id: b, team_name: teamNames[b], wins: 0, losses: 0, ties: 0 }
    ],
    bracket: null
  };
}

export function generateKnockoutBracket(teamIds, teamNames, startDate) {
  if (teamIds.length < 2) {
    throw new Error("Tournament format requires at least two teams");
  }

  const nextPower = 2 ** Math.ceil(Math.log2(teamIds.length));
  const seeded = [...teamIds, ...Array(nextPower - teamIds.length).fill(null)];

  const rounds = [];
  let participants = seeded;
  let totalMatchNo = 1;
  const totalRounds = Math.log2(nextPower);

  for (let r = 0; r < totalRounds; r += 1) {
    const matchCount = participants.length / 2;
    const matches = [];

    for (let i = 0; i < matchCount; i += 1) {
      const teamAId = r === 0 ? participants[i * 2] : null;
      const teamBId = r === 0 ? participants[i * 2 + 1] : null;
      matches.push({
        match_no: totalMatchNo,
        match_code: `R${r + 1}M${i + 1}`,
        team_a_id: teamAId,
        team_b_id: teamBId,
        team_a: teamAId ? teamNames[teamAId] : "TBD",
        team_b: teamBId ? teamNames[teamBId] : "TBD",
        source_a: r === 0 ? null : `R${r}M${i * 2 + 1}`,
        source_b: r === 0 ? null : `R${r}M${i * 2 + 2}`,
        scheduled_at: addDays(startDate, totalMatchNo - 1),
        status: "upcoming"
      });
      totalMatchNo += 1;
    }

    rounds.push({
      round_no: r + 1,
      round_name: roundName(matchCount, r + 1),
      matches
    });

    participants = Array(matchCount).fill("WINNER");
  }

  return {
    schedule: rounds.flatMap((round) => round.matches),
    standings: [],
    bracket: { rounds }
  };
}
