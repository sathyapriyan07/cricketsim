import { toLegacyOutcome } from "./helpers.js";

const templates = {
  "0": ["{bowler} beats {batsman} with a tight line, no run.", "Dot ball. {batsman} cannot pierce the infield."],
  "1": ["{batsman} nudges to mid-wicket for one.", "Quick single taken by {batsman}."],
  "2": ["Good placement by {batsman}, they run two.", "Driven into the gap, easy two."],
  "3": ["Excellent running, three completed.", "Into the deep and they race back for three."],
  "4": ["{bowler} bowls short, {batsman} pulls it for FOUR!", "Crisp timing by {batsman}, four runs."],
  "6": ["{batsman} launches it over long-on for SIX!", "Clean strike, maximum from {batsman}!"],
  W: ["{batsman} edges and it's CAUGHT!", "{bowler} strikes, wicket falls!"],
  Extra: ["Loose delivery from {bowler}, extra conceded.", "Wayward ball, umpire signals an extra."]
};

function fill(template, data) {
  return template.replaceAll("{batsman}", data.batsman || "Batsman").replaceAll("{bowler}", data.bowler || "Bowler");
}

export function generateBallCommentary(result, context = {}, rng = Math.random) {
  const bag = templates[result.outcome] || ["Play continues."];
  const line = bag[Math.floor(rng() * bag.length)];
  const core = fill(line, context);

  const tags = [];
  if (context.pitchType) tags.push(`Pitch ${context.pitchType}`);
  if (context.weather) tags.push(`Condition ${context.weather}`);
  if (result.outcome === "Extra" && result.extraType) tags.push(result.extraType);

  return {
    legacyOutcome: toLegacyOutcome(result.outcome),
    text: tags.length ? `${core} (${tags.join(" | ")})` : core,
    batsman: context.batsman || "Batsman",
    batsmanId: context.batsmanId || null,
    bowler: context.bowler || "Bowler",
    bowlerId: context.bowlerId || null
  };
}
