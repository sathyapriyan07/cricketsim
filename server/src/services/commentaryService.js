const lines = {
  dot: ["Defended with soft hands.", "Solid block, no run.", "Bowler wins that duel."],
  single: ["Quick single pinched.", "Works it into the gap for one.", "Easy single on offer."],
  double: ["Nicely placed, they come back for two.", "Great running, two more.", "Driven into space, two taken."],
  four: ["Crunched away for four!", "Threads the infield, boundary.", "Beautiful timing, four runs."],
  six: ["Launched over long-on, massive six!", "That is into the stands!", "Clean strike, maximum."],
  wicket: ["Edged and taken!", "Bowled him! Timber.", "Skied and caught in the deep."],
  wide: ["Too wide, extra run.", "Wayward line, signaled wide."],
  "no-ball": ["Overstepped, no-ball called.", "Free hit coming after that no-ball."]
};

export function generateCommentary(outcome, context = {}) {
  const bag = lines[outcome] || ["Play continues."];
  const core = bag[Math.floor(Math.random() * bag.length)];

  const detail = [];
  if (context.pitchType) detail.push(`Pitch: ${context.pitchType}`);
  if (context.weather) detail.push(`Weather: ${context.weather}`);
  if (context.injured) detail.push("Player looks uncomfortable after that effort.");

  return `${core}${detail.length ? ` (${detail.join(" | ")})` : ""}`;
}
