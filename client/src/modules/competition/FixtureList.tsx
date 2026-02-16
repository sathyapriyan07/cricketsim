type FixtureRow = {
  id: string;
  round?: number;
  round_name?: string;
  team_a_id?: string | null;
  team_b_id?: string | null;
  team_a_name?: string;
  team_b_name?: string;
  status?: string;
  result?: string | null;
  scheduled_at?: string;
};

export function FixtureList({
  fixtures = [],
  selectedFixtureId,
  onSelect,
  onPlay,
  showCompleted = true,
  playingFixtureId
}: {
  fixtures?: FixtureRow[];
  selectedFixtureId?: string | null;
  onSelect?: (fixtureId: string) => void;
  onPlay?: (fixtureId: string) => void;
  showCompleted?: boolean;
  playingFixtureId?: string | null;
}) {
  const visible = showCompleted ? fixtures : fixtures.filter((fixture) => fixture.status !== "completed");

  return (
    <div className="glass">
      <h3 className="mb-3 text-lg font-semibold">Fixtures</h3>
      <div className="space-y-2">
        {visible.map((fixture) => {
          const selected = selectedFixtureId === fixture.id;
          const completed = fixture.status === "completed";
          const playable = Boolean(fixture.team_a_id && fixture.team_b_id && !completed);
          const teamA = fixture.team_a_name || fixture.team_a_id || "TBD";
          const teamB = fixture.team_b_name || fixture.team_b_id || "TBD";

          return (
            <div
              key={fixture.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${selected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <button
                onClick={() => onSelect?.(fixture.id)}
                className="text-left"
              >
                <div className="text-sm font-medium text-gray-900">
                  {teamA} vs {teamB}
                </div>
                <div className="text-xs text-gray-500">
                  {fixture.round_name || `Round ${fixture.round || 1}`} | {new Date(fixture.scheduled_at || Date.now()).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-600">{fixture.result || (completed ? "Completed" : "Upcoming")}</div>
              </button>

              {!completed ? (
                <button
                  onClick={() => onPlay?.(fixture.id)}
                  disabled={!playable || playingFixtureId === fixture.id}
                  className="btn-primary"
                >
                  {playingFixtureId === fixture.id ? "Playing..." : playable ? "Play" : "Waiting"}
                </button>
              ) : (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Done</span>
              )}
            </div>
          );
        })}
      </div>
      {!visible.length && <p className="text-sm text-gray-500">No fixtures available.</p>}
    </div>
  );
}
