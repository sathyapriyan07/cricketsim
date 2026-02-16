import { clamp, DIFFICULTY_LEVELS, normalizeRatings, PITCH_TYPES, STRATEGIES, toNumber } from "./helpers.js";

const strategyMemo = new Map();
const pitchMemo = new Map();

export function getStrategyModifier(strategy = "rotate") {
  const key = STRATEGIES.includes(strategy) ? strategy : "rotate";
  if (strategyMemo.has(key)) return strategyMemo.get(key);

  const map = {
    block: { runRate: -10, boundary: -7, wicketRisk: -6, defense: 8 },
    rotate: { runRate: 4, boundary: -1, wicketRisk: -2, defense: 3 },
    strike: { runRate: 9, boundary: 4, wicketRisk: 3, defense: 0 },
    loft: { runRate: 15, boundary: 12, wicketRisk: 9, defense: -5 }
  };

  strategyMemo.set(key, map[key]);
  return map[key];
}

export function getPitchModifier(pitch = "balanced") {
  const key = PITCH_TYPES.includes(pitch) ? pitch : "balanced";
  if (pitchMemo.has(key)) return pitchMemo.get(key);

  const map = {
    flat: { batting: 8, bowling: -4, extraRate: 0 },
    green: { batting: -6, bowling: 9, extraRate: 1 },
    dusty: { batting: -2, bowling: 5, extraRate: 1 },
    balanced: { batting: 0, bowling: 0, extraRate: 0 }
  };

  pitchMemo.set(key, map[key]);
  return map[key];
}

export function batsmanSkillModifier(ratings = {}, fallbackSkill = 70) {
  const normalized = normalizeRatings(ratings, fallbackSkill);
  const batScore = (normalized.bat_power * 0.28) + (normalized.bat_timing * 0.27) + (normalized.bat_technique * 0.25) + (normalized.bat_temperament * 0.2);
  return (batScore - 70) * 0.8;
}

export function bowlerSkillModifier(ratings = {}, fallbackSkill = 70) {
  const normalized = normalizeRatings(ratings, fallbackSkill);
  const bowlScore = (normalized.bowl_accuracy * 0.4) + (normalized.bowl_variation * 0.3) + (normalized.bowl_control * 0.3);
  return (bowlScore - 70) * 0.9;
}

export function fatigueModifier(fatigue = 0) {
  const f = clamp(toNumber(fatigue, 0), 0, 100);
  return {
    batting: -f * 0.12,
    bowling: f * 0.05,
    wicketRisk: f * 0.08
  };
}

export function pressureModifier(state = {}) {
  const wickets = toNumber(state.wickets, 0);
  const runs = toNumber(state.runs, 0);
  const balls = Math.max(1, toNumber(state.balls, 1));
  const runRate = (runs * 6) / balls;

  return {
    batting: wickets >= 5 ? -4 : 0,
    bowling: wickets >= 5 ? 3 : 0,
    wicketRisk: wickets >= 5 ? 2 : 0,
    boundaryBoost: runRate < 6 ? -1 : 1
  };
}

export function conditionModifier(condition = "clear") {
  const map = {
    clear: { batting: 0, bowling: 0, extraRate: 0 },
    cloudy: { batting: -3, bowling: 4, extraRate: 1 },
    humid: { batting: -1, bowling: 2, extraRate: 1 },
    windy: { batting: -2, bowling: 1, extraRate: 2 }
  };

  return map[condition] || map.clear;
}

export function difficultyModifier(difficulty = "normal") {
  const d = DIFFICULTY_LEVELS.includes(difficulty) ? difficulty : "normal";
  if (d === "easy") return { batting: 10, bowling: -10 };
  if (d === "hard") return { batting: -10, bowling: 10 };
  return { batting: 0, bowling: 0 };
}

export function buildModifiers(input = {}) {
  const strategy = getStrategyModifier(input.action);
  const pitch = getPitchModifier(input.pitchType);
  const condition = conditionModifier(input.weather);
  const fatigue = fatigueModifier(input.fatigue);
  const pressure = pressureModifier(input.state);
  const difficulty = difficultyModifier(input.difficulty);

  const batSkill = batsmanSkillModifier(input.batsmanRatings, input.skill);
  const bowlSkill = bowlerSkillModifier(input.bowlerRatings, input.bowlerSkill);

  return {
    battingDelta: batSkill + strategy.runRate + strategy.defense + pitch.batting + condition.batting + fatigue.batting + pressure.batting + difficulty.batting,
    bowlingDelta: bowlSkill + pitch.bowling + condition.bowling + fatigue.bowling + pressure.bowling + difficulty.bowling,
    boundaryDelta: strategy.boundary + pressure.boundaryBoost,
    wicketRiskDelta: strategy.wicketRisk + fatigue.wicketRisk + pressure.wicketRisk,
    extraDelta: pitch.extraRate + condition.extraRate,
    strategy,
    pitch,
    condition,
    fatigue,
    pressure,
    difficulty
  };
}
