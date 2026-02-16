import { refreshRankings } from "../services/rankingService.js";
import { supabase } from "../config/supabase.js";

function byFormat(container = {}, format = "T20") {
  const key = String(format || "T20").toLowerCase();
  const current = container[key];
  if (current && typeof current === "object") return { ...container, __key: key, __stats: { ...current } };

  const looksNested = Object.values(container).some((value) => value && typeof value === "object" && !Array.isArray(value));
  if (!looksNested) {
    return { ...container, __key: "overall", __stats: { ...container } };
  }

  return { ...container, __key: key, __stats: {} };
}

function applyBattingStats(prev = {}, events = [], format = "T20") {
  const runs = events.reduce((sum, event) => sum + event.runs, 0);
  const fours = events.filter((event) => event.runs === 4).length;
  const sixes = events.filter((event) => event.runs === 6).length;
  const inningsBalls = events.filter((event) => event.legalBall !== false).length || 1;

  const wrapped = byFormat(prev, format);
  const stats = wrapped.__stats;

  const next = {
    ...stats,
    mat: Number(stats.mat || stats.matches || 0) + 1,
    inn: Number(stats.inn || stats.innings || 0) + 1,
    r: Number(stats.r || stats.runs || 0) + runs,
    hs: Math.max(Number(stats.hs || stats.highScore || 0), runs),
    sr: Number((((Number(stats.r || stats.runs || 0) + runs) / inningsBalls) * 100).toFixed(2)),
    avg: Number(stats.avg || stats.average || 0),
    fours: Number(stats.fours || 0) + fours,
    sixes: Number(stats.sixes || 0) + sixes,
    fifties: Number(stats.fifties || 0) + (runs >= 50 && runs < 100 ? 1 : 0),
    hundreds: Number(stats.hundreds || 0) + (runs >= 100 ? 1 : 0)
  };

  if (wrapped.__key === "overall") return next;
  return { ...prev, [wrapped.__key]: next };
}

function applyBowlingStats(prev = {}, events = [], format = "T20") {
  const wickets = events.filter((event) => event.wicket).length;
  const legalBalls = events.filter((event) => event.legalBall !== false).length || 1;
  const runsConceded = events.reduce((sum, event) => sum + event.runs, 0);

  const wrapped = byFormat(prev, format);
  const stats = wrapped.__stats;

  const next = {
    ...stats,
    mat: Number(stats.mat || stats.matches || 0) + 1,
    inn: Number(stats.inn || stats.innings || 0) + 1,
    w: Number(stats.w || stats.wickets || 0) + wickets,
    econ: Number((runsConceded / (legalBalls / 6)).toFixed(2)),
    avg: Number(stats.avg || stats.average || 0),
    best: `${Math.max(wickets, Number(String(stats.best || stats.bestFigures || "0/0").split("/")[0]))}/${runsConceded}`,
    threeW: Number(stats.threeW || 0) + (wickets >= 3 ? 1 : 0),
    fiveW: Number(stats.fiveW || 0) + (wickets >= 5 ? 1 : 0),
    sr: Number((((legalBalls || 1) / Math.max(1, wickets || 1))).toFixed(2))
  };

  if (wrapped.__key === "overall") return next;
  return { ...prev, [wrapped.__key]: next };
}

async function updatePlayerStats({ batterId, bowlerId, events, format }) {
  if (batterId) {
    const { data: batter } = await supabase.from("players").select("id, batting_stats_json").eq("id", batterId).single();
    if (batter?.id) {
      await supabase
        .from("players")
        .update({ batting_stats_json: applyBattingStats(batter.batting_stats_json || {}, events, format), updated_at: new Date().toISOString() })
        .eq("id", batter.id);
    }
  }

  if (bowlerId) {
    const { data: bowler } = await supabase.from("players").select("id, bowling_stats_json").eq("id", bowlerId).single();
    if (bowler?.id) {
      await supabase
        .from("players")
        .update({ bowling_stats_json: applyBowlingStats(bowler.bowling_stats_json || {}, events, format), updated_at: new Date().toISOString() })
        .eq("id", bowler.id);
    }
  }
}

export async function runPostMatchUpdates({ batterId, bowlerId, events, matchRecord, format = "T20" }) {
  await updatePlayerStats({ batterId, bowlerId, events, format });
  await supabase.from("matches").insert(matchRecord);
  await refreshRankings();
}
