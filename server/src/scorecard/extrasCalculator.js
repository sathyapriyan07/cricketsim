export function calculateExtras(events = []) {
  const extras = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalties: 0,
    total: 0
  };

  for (const event of events) {
    if (!event) continue;
    const extraType = event.extraType || event.extra_type || null;
    const runs = Number(event.runs || 0);

    if (extraType === "wide") extras.wides += runs || 1;
    else if (extraType === "no-ball" || extraType === "noball") extras.noBalls += runs || 1;
    else if (extraType === "bye") extras.byes += runs;
    else if (extraType === "leg-bye" || extraType === "legbye") extras.legByes += runs;
    else if (extraType === "penalty") extras.penalties += runs;
  }

  extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes + extras.penalties;
  return extras;
}

