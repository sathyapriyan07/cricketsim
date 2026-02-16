export function StandingsTable({ standings = [] }: { standings?: Array<Record<string, any>> }) {
  return (
    <div className="glass">
      <h3 className="mb-3 text-lg font-semibold">Standings</h3>
      <div className="overflow-x-auto">
        <table className="table-clean">
          <thead>
            <tr>
              <th>Team</th>
              <th>M</th>
              <th>W</th>
              <th>L</th>
              <th>Pts</th>
              <th>NRR</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr key={`${row.team_id || row.team}-${index}`}>
                <td>{row.team || row.team_name || row.team_id}</td>
                <td>{row.matches ?? row.played ?? 0}</td>
                <td>{row.wins ?? row.won ?? 0}</td>
                <td>{row.losses ?? row.lost ?? 0}</td>
                <td className="font-semibold">{row.points ?? 0}</td>
                <td>{Number(row.netRunRate ?? row.nrr ?? 0).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!standings.length && <p className="text-sm text-gray-500">No standings available yet.</p>}
    </div>
  );
}
