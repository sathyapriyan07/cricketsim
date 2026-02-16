function weightedChoice(entries) {
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  let point = Math.random() * total;
  for (const item of entries) {
    if (point < item.weight) return item.value;
    point -= item.weight;
  }
  return entries[0].value;
}

function moodMultiplier(action) {
  if (action === "block") return 0.6;
  if (action === "rotate") return 0.9;
  if (action === "strike") return 1.15;
  return 1.35;
}

export function simulateBall({ action = "rotate", skill = 70, bowlerSkill = 70, pitchType = "flat", weather = "clear", fatigue = 0 }) {
  const attack = skill * moodMultiplier(action);
  const control = bowlerSkill + fatigue * 0.5;

  const pitchFactor = pitchType === "green" ? -6 : pitchType === "dusty" ? 4 : 0;
  const weatherFactor = weather === "cloudy" ? -5 : weather === "humid" ? -2 : 1;
  const net = attack - control + pitchFactor + weatherFactor;

  const wicketChance = Math.max(0.03, Math.min(0.35, 0.14 - net / 300));
  const injuryChance = Math.max(0.01, fatigue / 200);

  const outcome = weightedChoice([
    { value: "dot", weight: Math.max(20, 36 - net * 0.12) },
    { value: "single", weight: 28 },
    { value: "double", weight: Math.max(7, 11 + net * 0.06) },
    { value: "four", weight: Math.max(6, 12 + net * 0.08) },
    { value: "six", weight: Math.max(2, 5 + net * 0.05) },
    { value: "wicket", weight: wicketChance * 100 },
    { value: "wide", weight: 4 },
    { value: "no-ball", weight: 2 }
  ]);

  let runs = 0;
  let wicket = false;

  if (outcome === "single") runs = 1;
  if (outcome === "double") runs = 2;
  if (outcome === "four") runs = 4;
  if (outcome === "six") runs = 6;
  if (outcome === "wide" || outcome === "no-ball") runs = 1;
  if (outcome === "wicket") wicket = true;

  const injured = Math.random() < injuryChance;

  return { outcome, runs, wicket, injured };
}

export function simulateManyBalls({ balls = 6, ...ctx }) {
  let fatigue = ctx.fatigue || 0;
  const events = [];

  for (let i = 0; i < balls; i += 1) {
    const result = simulateBall({ ...ctx, fatigue });
    fatigue += 4;
    events.push(result);
  }

  return events;
}
