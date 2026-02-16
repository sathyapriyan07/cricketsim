import { BowlingRow } from "./scorecardStore";

export function BowlingTable({ rows }: { rows: BowlingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-clean">
        <thead>
          <tr>
            <th>Bowler</th>
            <th>O</th>
            <th>M</th>
            <th>R</th>
            <th>W</th>
            <th>Econ</th>
            <th>NB</th>
            <th>WD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.bowler}>
              <td>{row.bowler}</td>
              <td>{row.overs}</td>
              <td>{row.maidens}</td>
              <td>{row.runsConceded}</td>
              <td className="font-semibold">{row.wickets}</td>
              <td>{row.economy}</td>
              <td>{row.noBalls}</td>
              <td>{row.wides}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="text-gray-500">No bowling events yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

