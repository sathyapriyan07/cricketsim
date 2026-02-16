import { generateBallCommentary } from "./commentary.js";
import { buildModifiers } from "./modifiers.js";
import { ballNotation, clamp, createRng, toLegacyOutcome, toNumber } from "./helpers.js";
import { generateBallOutcome } from "./probability.js";

function normalizeState(input = {}) {
  return {
    runs: toNumber(input.runs, 0),
    wickets: toNumber(input.wickets, 0),
    balls: toNumber(input.balls, 0)
  };
}

function normalizeContext(input = {}) {
  const strategy = input.action || "rotate";
  const difficulty = input.difficulty || "normal";
  const pitchType = input.pitchType || "balanced";
  const weather = input.weather || "clear";

  return {
    action: strategy,
    difficulty,
    pitchType,
    weather,
    fatigue: clamp(toNumber(input.fatigue, 0), 0, 100),
    skill: clamp(toNumber(input.skill, 70), 1, 100),
    bowlerSkill: clamp(toNumber(input.bowlerSkill, 70), 1, 100),
    batsmanRatings: input.batsmanRatings || {},
    bowlerRatings: input.bowlerRatings || {},
    batsmanId: input.batsmanId || input.batterId || null,
    bowlerId: input.bowlerId || null,
    batsmanName: input.batsmanName || "Batsman",
    bowlerName: input.bowlerName || "Bowler"
  };
}

function toEvent(result, commentary, stateBeforeBall) {
  return {
    ball: ballNotation(stateBeforeBall.balls),
    outcome: toLegacyOutcome(result.outcome),
    outcomeKey: result.outcome,
    runs: result.runs,
    wicket: result.wicket,
    legalBall: result.legalBall,
    extraType: result.extraType || null,
    batsman: commentary.batsman || null,
    batsmanId: commentary.batsmanId || null,
    bowler: commentary.bowler || null,
    bowlerId: commentary.bowlerId || null,
    dismissalType: result.dismissalType || null,
    fielder: result.fielder || null,
    commentary: commentary.text,
    weights: result.weights
  };
}

export function simulateBallByBall(input = {}) {
  const state = normalizeState(input.state);
  const ctx = normalizeContext(input);
  const rng = createRng(input.seed || `${Date.now()}-${state.balls}`);

  const modifiers = buildModifiers({
    ...ctx,
    state
  });

  const result = generateBallOutcome(modifiers, rng);
  const commentary = generateBallCommentary(result, {
    batsman: ctx.batsmanName,
    batsmanId: ctx.batsmanId,
    bowler: ctx.bowlerName,
    bowlerId: ctx.bowlerId,
    pitchType: ctx.pitchType,
    weather: ctx.weather
  }, rng);

  const event = toEvent(result, commentary, state);

  const nextState = {
    runs: state.runs + result.runs,
    wickets: state.wickets + (result.wicket ? 1 : 0),
    balls: state.balls + (result.legalBall ? 1 : 0)
  };

  return {
    event,
    state: nextState,
    modifiers
  };
}

export function simulateOver(input = {}) {
  const ctx = normalizeContext(input);
  const maxBalls = Math.max(1, toNumber(input.balls, 6));
  const rng = createRng(input.seed || `over-${Date.now()}`);

  let state = normalizeState(input.state);
  const events = [];

  for (let i = 0; i < maxBalls; i += 1) {
    const modifiers = buildModifiers({ ...ctx, fatigue: clamp(ctx.fatigue + i * 4, 0, 100), state });
    const result = generateBallOutcome(modifiers, rng);
    const commentary = generateBallCommentary(result, {
      batsman: ctx.batsmanName,
      batsmanId: ctx.batsmanId,
      bowler: ctx.bowlerName,
      bowlerId: ctx.bowlerId,
      pitchType: ctx.pitchType,
      weather: ctx.weather
    }, rng);

    const event = toEvent(result, commentary, state);
    events.push(event);

    state = {
      runs: state.runs + result.runs,
      wickets: state.wickets + (result.wicket ? 1 : 0),
      balls: state.balls + (result.legalBall ? 1 : 0)
    };
  }

  return {
    events,
    state,
    summary: {
      runs: state.runs,
      wickets: state.wickets,
      overs: `${Math.floor(state.balls / 6)}.${state.balls % 6}`
    }
  };
}
