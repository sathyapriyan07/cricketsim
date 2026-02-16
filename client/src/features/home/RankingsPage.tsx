import { GlassCard } from "components/GlassCard";
import { useAppStore } from "store/useAppStore";

export function RankingsPage() {
  const { rankings } = useAppStore();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Live Rankings</h1>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Category</th>
                <th>Entity</th>
                <th className="text-right">Points</th>
              </tr>
            </thead>
            <tbody>
            {rankings.map((ranking) => (
              <tr key={ranking.id}>
                <td>{ranking.category}</td>
                <td>{ranking.player_id || ranking.team_id}</td>
                <td className="text-right font-semibold text-gray-900">{ranking.points}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
