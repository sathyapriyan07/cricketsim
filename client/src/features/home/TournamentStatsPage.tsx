import { GlassCard } from "components/GlassCard";

const points = [
  { team: "Falcons", p: 10, w: 8, l: 2, nrr: "+1.24" },
  { team: "Titans", p: 10, w: 7, l: 3, nrr: "+0.94" },
  { team: "Rangers", p: 10, w: 5, l: 5, nrr: "+0.11" },
  { team: "Spartans", p: 10, w: 3, l: 7, nrr: "-0.82" }
];

const scorers = [
  ["A. Kumar", 522],
  ["D. Roy", 488],
  ["N. Shah", 455]
];

const wicketTakers = [
  ["M. Iqbal", 19],
  ["S. Carter", 17],
  ["R. Nair", 16]
];

export function TournamentStatsPage({ mode }: { mode: "league" | "series" | "tournament" }) {
  const title = mode.charAt(0).toUpperCase() + mode.slice(1);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title} Stats</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Points Table</h2>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Team</th><th>P</th><th>W</th><th>L</th><th>NRR</th>
                </tr>
              </thead>
              <tbody>
              {points.map((row) => (
                <tr key={row.team}>
                  <td>{row.team}</td><td>{row.p}</td><td>{row.w}</td><td>{row.l}</td><td>{row.nrr}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Caps</h2>
          <div className="space-y-2">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-orange-700">Orange Cap: {scorers[0][0]} ({scorers[0][1]})</div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-violet-700">Purple Cap: {wicketTakers[0][0]} ({wicketTakers[0][1]})</div>
          </div>
        </GlassCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Top Run Scorers</h2>
          {scorers.map((entry) => <div key={entry[0]} className="py-1">{entry[0]} - {entry[1]}</div>)}
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Top Wicket Takers</h2>
          {wicketTakers.map((entry) => <div key={entry[0]} className="py-1">{entry[0]} - {entry[1]}</div>)}
        </GlassCard>
      </div>
    </div>
  );
}
