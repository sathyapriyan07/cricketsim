import { InningsScorecard } from "./scorecardStore";

export function FallOfWickets({ innings }: { innings: InningsScorecard }) {
  return (
    <div className="glass">
      <h3 className="mb-2 text-sm font-semibold">Fall of Wickets</h3>
      <div className="space-y-1 text-sm">
        {innings.fallOfWickets.map((row) => (
          <div key={`${row.wicketNo}-${row.over}`} className="rounded-md bg-gray-50 px-2 py-1">
            {row.wicketNo}. {row.score} ({row.batsman}, {row.over})
          </div>
        ))}
        {!innings.fallOfWickets.length && <p className="text-gray-500">No wickets yet.</p>}
      </div>
    </div>
  );
}

