import { buildBattingStats } from "./battingStats.js";
import { buildBowlingStats } from "./bowlingStats.js";
import { calculateExtras } from "./extrasCalculator.js";
import { buildFallOfWickets } from "./fallOfWickets.js";
import { buildOverSummary } from "./overSummary.js";

function splitByInnings(events = []) {
  const inningsMap = new Map();

  for (const event of events) {
    const innings = Number(event.innings || 1);
    const rows = inningsMap.get(innings) || [];
    rows.push(event);
    inningsMap.set(innings, rows);
  }

  return [...inningsMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([inningsNo, rows]) => ({ inningsNo, events: rows }));
}

function inningsScore(events = []) {
  const legalBalls = events.reduce((sum, event) => sum + (event.legalBall === false ? 0 : 1), 0);
  const runs = events.reduce((sum, event) => sum + Number(event.runs || 0), 0);
  const wickets = events.filter((event) => event.wicket).length;
  return {
    totalRuns: runs,
    wickets,
    overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`
  };
}

export function buildScorecard({
  events = [],
  result = "",
  format = "T20",
  teams = [],
  venue = null
} = {}) {
  const inningsEvents = splitByInnings(events);

  const innings = inningsEvents.map(({ inningsNo, events: inningsRows }) => {
    const totals = inningsScore(inningsRows);
    const extras = calculateExtras(inningsRows);
    const batting = buildBattingStats(inningsRows);
    const bowling = buildBowlingStats(inningsRows);
    const fallOfWickets = buildFallOfWickets(inningsRows);
    const overSummary = buildOverSummary(inningsRows);

    return {
      inningsNo,
      team: teams[inningsNo - 1] || `Team ${inningsNo}`,
      totalRuns: totals.totalRuns,
      wickets: totals.wickets,
      overs: totals.overs,
      extras,
      batting,
      bowling,
      fallOfWickets,
      overSummary
    };
  });

  return {
    format,
    venue,
    result,
    innings,
    generated_at: new Date().toISOString()
  };
}

