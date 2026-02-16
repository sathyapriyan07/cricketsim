import { Team } from "lib/types";

export function TeamSelect({ teams, selectedTeamId, onSelect }: { teams: Team[]; selectedTeamId: string | null; onSelect: (teamId: string) => void }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Select Team</h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const selected = selectedTeamId === team.id;
          return (
            <button
              key={team.id}
              onClick={() => onSelect(team.id)}
              className={`rounded-xl border p-3 text-left transition ${selected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}
            >
              <div className="font-medium">{team.name}</div>
              <div className="text-xs text-gray-500">Squad: {team.squad_player_ids?.length || 0} players</div>
            </button>
          );
        })}
      </div>
      {!teams.length && <p className="text-sm text-gray-500">No teams configured for this competition.</p>}
    </div>
  );
}
