import { useNavigate } from "react-router-dom";
import { GlassCard } from "components/GlassCard";
import { Competition, CompetitionType } from "lib/types";

function dateFromCompetition(competition: Competition) {
  const firstMatch = Array.isArray(competition.schedule_json) ? competition.schedule_json[0] : null;
  const scheduledAt = typeof firstMatch === "object" && firstMatch && "scheduled_at" in firstMatch
    ? String((firstMatch as any).scheduled_at)
    : competition.created_at;

  return new Date(scheduledAt).toLocaleDateString();
}

export function CompetitionCard({ competition, type }: { competition: Competition; type: CompetitionType }) {
  const navigate = useNavigate();
  const teamCount = competition.team_ids?.length || 0;

  const playLabel = type === "series" ? "Play Series" : type === "league" ? "Play League" : "Play Tournament";

  return (
    <GlassCard className="border border-gray-200 transition hover:border-blue-300 hover:shadow-cardHover">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{competition.name}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>Format: {competition.format}</div>
          <div>Teams: {teamCount}</div>
          <div className="col-span-2">Start Date: {dateFromCompetition(competition)}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/${type}/${competition.id}`)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            View Stats
          </button>
          <button
            onClick={() => navigate(`/${type}/${competition.id}`)}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            {playLabel}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
