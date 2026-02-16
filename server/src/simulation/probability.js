import { clamp, pickWeighted } from "./helpers.js";

const BASE_WEIGHTS = {
  "0": 30,
  "1": 26,
  "2": 10,
  "3": 2,
  "4": 10,
  "6": 4,
  W: 12,
  Extra: 6
};

export function calculateWeights(modifiers) {
  const net = modifiers.battingDelta - modifiers.bowlingDelta;

  const weights = {
    "0": BASE_WEIGHTS["0"] + clamp(-net * 0.35, -8, 18),
    "1": BASE_WEIGHTS["1"] + clamp(net * 0.05, -5, 6),
    "2": BASE_WEIGHTS["2"] + clamp(net * 0.09, -5, 8),
    "3": BASE_WEIGHTS["3"] + clamp(net * 0.03, -2, 3),
    "4": BASE_WEIGHTS["4"] + clamp(net * 0.14 + modifiers.boundaryDelta, -8, 18),
    "6": BASE_WEIGHTS["6"] + clamp(net * 0.09 + modifiers.boundaryDelta * 0.5, -3, 11),
    W: BASE_WEIGHTS.W + clamp(-net * 0.12 + modifiers.wicketRiskDelta, -6, 14),
    Extra: BASE_WEIGHTS.Extra + clamp(modifiers.extraDelta, -2, 6)
  };

  for (const key of Object.keys(weights)) {
    weights[key] = Math.max(1, Number(weights[key].toFixed(3)));
  }

  return weights;
}

export function resolveOutcome(outcomeKey, rng = Math.random) {
  if (outcomeKey === "W") {
    const dismissalType = rng() < 0.55 ? "caught" : rng() < 0.82 ? "bowled" : "lbw";
    return { outcome: "W", runs: 0, wicket: true, isExtra: false, legalBall: true, dismissalType };
  }

  if (outcomeKey === "Extra") {
    const extraType = rng() < 0.72 ? "wide" : "no-ball";
    return { outcome: "Extra", runs: 1, wicket: false, isExtra: true, extraType, legalBall: false };
  }

  const runs = Number(outcomeKey);
  return { outcome: outcomeKey, runs, wicket: false, isExtra: false, legalBall: true };
}

export function generateBallOutcome(modifiers, rng = Math.random) {
  const weights = calculateWeights(modifiers);
  const outcomeKey = pickWeighted(weights, rng);
  return {
    ...resolveOutcome(outcomeKey, rng),
    weights
  };
}
