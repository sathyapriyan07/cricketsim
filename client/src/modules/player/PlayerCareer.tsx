import { useMemo } from "react";
import { BattingTable } from "./BattingTable";
import { BowlingTable } from "./BowlingTable";
import { PlayerHeader } from "./PlayerHeader";
import { usePlayerStats } from "./playerHooks";

export function PlayerCareer({ playerId }: { playerId: string }) {
  const { player, battingRows, bowlingRows, loading, error } = usePlayerStats(playerId);

  const totals = useMemo(() => {
    const runs = battingRows.reduce((sum, row) => sum + Number(row.values.r || 0), 0);
    const wickets = bowlingRows.reduce((sum, row) => sum + Number(row.values.w || 0), 0);
    return { runs, wickets };
  }, [battingRows, bowlingRows]);

  if (loading) {
    return <div className="rounded-xl bg-white p-4 text-slate-700 shadow-sm">Loading career stats...</div>;
  }

  if (error || !player) {
    return <div className="rounded-xl bg-white p-4 text-rose-600 shadow-sm">{error || "Player not found."}</div>;
  }

  const careerMeta = (player.career_stats_json || {}) as Record<string, unknown>;
  const teamLogo = typeof careerMeta.teamLogoUrl === "string" ? careerMeta.teamLogoUrl : undefined;

  return (
    <div className="space-y-4">
      <PlayerHeader name={player.name} role={player.role} imageUrl={player.image_url} teamLogoUrl={teamLogo} />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Career Runs</div>
          <div className="text-2xl font-bold text-slate-900">{totals.runs}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Career Wickets</div>
          <div className="text-2xl font-bold text-slate-900">{totals.wickets}</div>
        </div>
      </div>

      <BattingTable rows={battingRows} />
      <BowlingTable rows={bowlingRows} />
    </div>
  );
}
