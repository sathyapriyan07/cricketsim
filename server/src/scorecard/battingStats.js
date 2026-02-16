function initBatter(name, order) {
  return {
    batter: name || "Batsman",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    dismissalType: "not out",
    bowler: null,
    fielder: null,
    out: false,
    order
  };
}

export function buildBattingStats(events = []) {
  const map = new Map();
  let seq = 0;

  for (const event of events) {
    const batterName = event.batsman || event.batterName || "Batsman";
    if (!map.has(batterName)) {
      map.set(batterName, initBatter(batterName, seq));
      seq += 1;
    }

    const row = map.get(batterName);
    const runs = Number(event.runs || 0);
    const legalBall = event.legalBall !== false;
    const isByeType = event.extraType === "bye" || event.extraType === "leg-bye" || event.extraType === "legbye";

    if (legalBall) row.balls += 1;
    if (!isByeType) row.runs += runs;
    if (!isByeType && runs === 4) row.fours += 1;
    if (!isByeType && runs === 6) row.sixes += 1;

    if (event.wicket) {
      row.out = true;
      row.dismissalType = event.dismissalType || "out";
      row.bowler = event.bowler || null;
      row.fielder = event.fielder || null;
    }
  }

  const rows = [...map.values()].sort((a, b) => a.order - b.order);
  return rows.map((row) => ({
    batter: row.batter,
    runs: row.runs,
    balls: row.balls,
    fours: row.fours,
    sixes: row.sixes,
    strikeRate: row.balls ? Number(((row.runs / row.balls) * 100).toFixed(2)) : 0,
    dismissalType: row.dismissalType,
    bowler: row.bowler,
    fielder: row.fielder
  }));
}

