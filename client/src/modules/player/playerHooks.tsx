import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "services/api";
import { Player } from "lib/types";
import { useAppStore } from "store/useAppStore";
import { usePlayerStore } from "store/playerStore";
import { StatsRow } from "./StatsTable";

const playerCache = new Map<string, Player>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValue(source: Record<string, unknown>, keys: string[], fallback: string | number = 0) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key] as string | number;
  }
  return fallback;
}

function rowFromBatting(format: string, stats: Record<string, unknown>): StatsRow {
  return {
    id: `bat-${format}`,
    values: {
      format: <span className="text-slate-500">{format.toUpperCase()}</span>,
      mat: getValue(stats, ["mat", "matches"]),
      inn: getValue(stats, ["inn", "innings"]),
      r: getValue(stats, ["r", "runs"]),
      hundreds: getValue(stats, ["hundreds", "100s"]),
      fifties: getValue(stats, ["fifties", "50s"]),
      hs: getValue(stats, ["hs", "highScore"]),
      sr: getValue(stats, ["sr", "strikeRate"]),
      avg: getValue(stats, ["avg", "average"]),
      fours: getValue(stats, ["fours", "4s"]),
      sixes: getValue(stats, ["sixes", "6s"])
    }
  };
}

function rowFromBowling(format: string, stats: Record<string, unknown>): StatsRow {
  return {
    id: `bowl-${format}`,
    values: {
      format: <span className="text-slate-500">{format.toUpperCase()}</span>,
      mat: getValue(stats, ["mat", "matches"]),
      inn: getValue(stats, ["inn", "innings"]),
      w: getValue(stats, ["w", "wickets"]),
      econ: getValue(stats, ["econ", "economy"]),
      avg: getValue(stats, ["avg", "average"]),
      best: getValue(stats, ["best", "bestFigures"], "-"),
      threeW: getValue(stats, ["threeW", "3W", "three_w"], 0),
      fiveW: getValue(stats, ["fiveW", "5W", "five_w"], 0),
      sr: getValue(stats, ["sr", "strikeRate"], 0)
    }
  };
}

function mapFormatRows(source: Record<string, unknown> | undefined, type: "batting" | "bowling") {
  if (!source || !Object.keys(source).length) return [] as StatsRow[];

  const entries = Object.entries(source);
  const hasNestedFormats = entries.some(([, value]) => isObject(value));

  if (hasNestedFormats) {
    return entries
      .filter(([, value]) => isObject(value))
      .map(([format, stats]) => (type === "batting" ? rowFromBatting(format, stats as Record<string, unknown>) : rowFromBowling(format, stats as Record<string, unknown>)));
  }

  return [type === "batting" ? rowFromBatting("overall", source) : rowFromBowling("overall", source)];
}

export function usePlayerStats(playerId: string) {
  const { players } = useAppStore();
  const { players: domainPlayers } = usePlayerStore();
  const [remotePlayer, setRemotePlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cachedPlayer = useMemo(
    () => players.find((entry) => entry.id === playerId) || domainPlayers.find((entry) => entry.id === playerId) || playerCache.get(playerId) || null,
    [players, domainPlayers, playerId]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        if (cachedPlayer) {
          if (active) {
            setRemotePlayer(cachedPlayer);
            setError(null);
            setLoading(false);
          }
          return;
        }

        const allPlayers = await apiFetch<Player[]>("/players");
        const next = allPlayers.find((entry) => entry.id === playerId) || null;
        if (next) playerCache.set(playerId, next);

        if (active) {
          setRemotePlayer(next);
          setError(next ? null : "Player not found.");
        }
      } catch {
        if (active) setError("Failed to load player stats.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [playerId, cachedPlayer]);

  const player = cachedPlayer || remotePlayer;

  const battingRows = useMemo(() => mapFormatRows(player?.batting_stats_json, "batting"), [player]);
  const bowlingRows = useMemo(() => mapFormatRows(player?.bowling_stats_json, "bowling"), [player]);

  return {
    player,
    battingRows,
    bowlingRows,
    loading,
    error
  };
}
