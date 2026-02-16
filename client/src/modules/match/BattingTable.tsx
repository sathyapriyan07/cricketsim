import { BattingRow } from "./scorecardStore";

export function BattingTable({ rows }: { rows: BattingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-clean">
        <thead>
          <tr>
            <th>Batter</th>
            <th>R</th>
            <th>B</th>
            <th>4s</th>
            <th>6s</th>
            <th>SR</th>
            <th>Dismissal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.batter}>
              <td>{row.batter}</td>
              <td className="font-semibold">{row.runs}</td>
              <td>{row.balls}</td>
              <td>{row.fours}</td>
              <td>{row.sixes}</td>
              <td>{row.strikeRate}</td>
              <td className="text-gray-600">
                {row.dismissalType}
                {row.bowler ? ` b ${row.bowler}` : ""}
                {row.fielder ? ` c ${row.fielder}` : ""}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="text-gray-500">No batting events yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

