function initBowler(name, order) {
  return {
    bowler: name || "Bowler",
    balls: 0,
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    noBalls: 0,
    wides: 0,
    order
  };
}

export function buildBowlingStats(events = []) {
  const map = new Map();
  let seq = 0;

  for (const event of events) {
    const bowlerName = event.bowler || event.bowlerName || "Bowler";
    if (!map.has(bowlerName)) {
      map.set(bowlerName, initBowler(bowlerName, seq));
      seq += 1;
    }

    const row = map.get(bowlerName);
    const runs = Number(event.runs || 0);
    const legalBall = event.legalBall !== false;
    const extraType = event.extraType || null;

    row.runsConceded += runs;
    if (legalBall) row.balls += 1;
    if (event.wicket) row.wickets += 1;
    if (extraType === "wide") row.wides += 1;
    if (extraType === "no-ball" || extraType === "noball") row.noBalls += 1;
  }

  const rows = [...map.values()].sort((a, b) => a.order - b.order);

  // Maiden over estimation by grouping legal balls into overs in sequence per bowler.
  for (const row of rows) {
    const fullOvers = Math.floor(row.balls / 6);
    row.maidens = Math.max(0, Math.min(fullOvers, row.runsConceded === 0 ? fullOvers : 0));
  }

  return rows.map((row) => {
    const oversWhole = Math.floor(row.balls / 6);
    const oversPart = row.balls % 6;
    const overs = `${oversWhole}.${oversPart}`;
    const oversFloat = row.balls / 6 || 1;

    return {
      bowler: row.bowler,
      overs,
      maidens: row.maidens,
      runsConceded: row.runsConceded,
      wickets: row.wickets,
      economy: Number((row.runsConceded / oversFloat).toFixed(2)),
      noBalls: row.noBalls,
      wides: row.wides
    };
  });
}

