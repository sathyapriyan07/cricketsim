function ballToIndex(ball) {
  const [over, ballNum] = String(ball || "0.1").split(".");
  return Number(over || 0) * 6 + Number(ballNum || 1) - 1;
}

export function buildFallOfWickets(events = []) {
  const sorted = [...events].sort((a, b) => ballToIndex(a.ball) - ballToIndex(b.ball));
  const fall = [];
  let runs = 0;
  let wickets = 0;

  for (const event of sorted) {
    runs += Number(event.runs || 0);
    if (!event.wicket) continue;

    wickets += 1;
    fall.push({
      wicketNo: wickets,
      score: `${runs}/${wickets}`,
      over: event.ball || null,
      batsman: event.batsman || event.batterName || "Batsman"
    });
  }

  return fall;
}

