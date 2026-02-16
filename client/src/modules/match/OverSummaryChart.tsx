import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InningsScorecard } from "./scorecardStore";

export function OverSummaryChart({ innings }: { innings: InningsScorecard }) {
  const data = innings.overSummary.map((row) => ({
    over: row.over,
    runs: row.runs,
    wickets: row.wickets
  }));

  return (
    <div className="glass">
      <h3 className="mb-2 text-sm font-semibold">Over Summary</h3>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="over" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="runs" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="wickets" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

