import { BattingTable } from "./BattingTable";
import { BowlingTable } from "./BowlingTable";
import { ExtrasCard } from "./ExtrasCard";
import { FallOfWickets } from "./FallOfWickets";
import { OverSummaryChart } from "./OverSummaryChart";
import { MatchScorecard } from "./scorecardStore";

export function Scorecard({
  scorecard,
  currentInnings,
  onInningsChange
}: {
  scorecard: MatchScorecard;
  currentInnings: number;
  onInningsChange: (innings: number) => void;
}) {
  const innings = scorecard.innings[currentInnings - 1];
  if (!innings) return null;

  return (
    <div className="space-y-3">
      <div className="glass">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Scorecard</h2>
          <p className="text-sm text-gray-600">
            {scorecard.format} {scorecard.venue ? `| ${scorecard.venue}` : ""}
          </p>
        </div>
        <p className="text-sm text-gray-600">{scorecard.result || "-"}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scorecard.innings.map((item) => (
            <button
              key={item.inningsNo}
              onClick={() => onInningsChange(item.inningsNo)}
              className={`rounded-lg px-3 py-1.5 text-sm ${currentInnings === item.inningsNo ? "bg-blue-600 text-white" : "border border-gray-300 bg-white text-gray-700"}`}
            >
              Innings {item.inningsNo} ({item.team})
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-700">
          <span className="font-semibold">{innings.team}</span>:{" "}
          <span className="font-semibold">{innings.totalRuns}/{innings.wickets}</span> ({innings.overs})
        </div>
      </div>

      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold">Batting</h3>
        <BattingTable rows={innings.batting} />
      </div>

      <div className="glass">
        <h3 className="mb-2 text-sm font-semibold">Bowling</h3>
        <BowlingTable rows={innings.bowling} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ExtrasCard innings={innings} />
        <FallOfWickets innings={innings} />
        <OverSummaryChart innings={innings} />
      </div>
    </div>
  );
}

