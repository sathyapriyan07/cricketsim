function ballToIndex(ball) {
  const [over, ballNum] = String(ball || "0.1").split(".");
  return Number(over || 0) * 6 + Number(ballNum || 1) - 1;
}

export function buildOverSummary(events = []) {
  const sorted = [...events].sort((a, b) => ballToIndex(a.ball) - ballToIndex(b.ball));
  const map = new Map();

  for (const event of sorted) {
    const overKey = Number(String(event.ball || "0.1").split(".")[0] || 0);
    const row = map.get(overKey) || {
      over: overKey + 1,
      runs: 0,
      wickets: 0,
      balls: [],
      scoreAfterOver: "0/0"
    };

    row.runs += Number(event.runs || 0);
    if (event.wicket) row.wickets += 1;
    row.balls.push(event.wicket ? "W" : event.extraType ? `${event.runs || 1}${String(event.extraType).charAt(0).toUpperCase()}` : String(event.runs || 0));
    map.set(overKey, row);
  }

  const rows = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, value]) => value);

  let totalRuns = 0;
  let totalWickets = 0;
  for (const row of rows) {
    totalRuns += row.runs;
    totalWickets += row.wickets;
    row.scoreAfterOver = `${totalRuns}/${totalWickets}`;
  }

  return rows;
}

