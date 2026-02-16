export function BracketView({ bracket, fixtures = [] }: { bracket?: Record<string, any> | null; fixtures?: Array<Record<string, any>> }) {
  if (!bracket || !Array.isArray(bracket.rounds)) {
    return (
      <div className="glass">
        <h3 className="mb-2 text-lg font-semibold">Bracket</h3>
        <p className="text-sm text-gray-500">Bracket is not available for this competition.</p>
      </div>
    );
  }

  const fixtureMap = Object.fromEntries((fixtures || []).map((fixture) => [fixture.id, fixture]));

  return (
    <div className="glass">
      <h3 className="mb-3 text-lg font-semibold">Knockout Bracket</h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {bracket.rounds.map((round: any) => (
          <div key={round.round_no} className="rounded-lg border border-gray-200 bg-white p-3">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">{round.round_name}</h4>
            <div className="space-y-2">
              {(round.matches || []).map((fixtureId: string) => {
                const fixture = fixtureMap[fixtureId] || {};
                return (
                  <div key={fixtureId} className="rounded-md bg-gray-50 p-2 text-xs">
                    <div>{fixture.team_a_name || fixture.team_a_id || "TBD"}</div>
                    <div>{fixture.team_b_name || fixture.team_b_id || "TBD"}</div>
                    <div className="text-gray-500">{fixture.result || fixture.status || "upcoming"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
