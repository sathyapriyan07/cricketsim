import { GlassCard } from "components/GlassCard";
import { CompetitionType } from "lib/types";
import { useCompetitions } from "./competitionHooks";
import { CompetitionCard } from "./CompetitionCard";

export function CompetitionList({ type }: { type: CompetitionType }) {
  const { competitions, loading, error } = useCompetitions(type);
  const heading = type === "series" ? "Series" : type === "league" ? "Leagues" : "Tournaments";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <p className="text-sm text-gray-600">Select a {type} to view details, choose your team, and continue to Playing XI.</p>

      {loading && <GlassCard>Loading competitions...</GlassCard>}
      {error && <GlassCard className="text-red-600">{error}</GlassCard>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} type={type} />
        ))}
      </div>

      {!loading && !competitions.length && <GlassCard>No {type} competitions found.</GlassCard>}
    </div>
  );
}
