export const OUTCOMES = ["0", "1", "2", "3", "4", "6", "W", "Extra"];
export const PITCH_TYPES = ["flat", "green", "dusty", "balanced"];
export const CONDITIONS = ["clear", "cloudy", "humid", "windy"];
export const STRATEGIES = ["block", "rotate", "strike", "loft"];
export const DIFFICULTY_LEVELS = ["easy", "normal", "hard"];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeRatings(ratings = {}, fallback = 70) {
  return {
    bat_power: toNumber(ratings.bat_power, fallback),
    bat_timing: toNumber(ratings.bat_timing, fallback),
    bat_technique: toNumber(ratings.bat_technique, fallback),
    bat_temperament: toNumber(ratings.bat_temperament, fallback),
    bowl_accuracy: toNumber(ratings.bowl_accuracy, fallback),
    bowl_variation: toNumber(ratings.bowl_variation, fallback),
    bowl_control: toNumber(ratings.bowl_control, fallback)
  };
}

function hashSeed(seed) {
  const input = String(seed || "default-seed");
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(weights, rng = Math.random) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let point = rng() * total;

  for (const [key, weight] of entries) {
    if (point < weight) return key;
    point -= weight;
  }

  return entries[0]?.[0] || "0";
}

export function ballNotation(legalBallsBeforeBall) {
  return `${Math.floor(legalBallsBeforeBall / 6)}.${(legalBallsBeforeBall % 6) + 1}`;
}

export function toLegacyOutcome(outcome) {
  if (outcome === "0") return "dot";
  if (outcome === "1") return "single";
  if (outcome === "2") return "double";
  if (outcome === "3") return "three";
  if (outcome === "4") return "four";
  if (outcome === "6") return "six";
  if (outcome === "W") return "wicket";
  return "extra";
}
