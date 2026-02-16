import { InningsScorecard } from "./scorecardStore";

export function ExtrasCard({ innings }: { innings: InningsScorecard }) {
  const extras = innings.extras;
  return (
    <div className="glass">
      <h3 className="mb-2 text-sm font-semibold">Extras</h3>
      <div className="grid grid-cols-3 gap-2 text-sm text-gray-700">
        <div>Wd: <span className="font-semibold">{extras.wides}</span></div>
        <div>Nb: <span className="font-semibold">{extras.noBalls}</span></div>
        <div>B: <span className="font-semibold">{extras.byes}</span></div>
        <div>Lb: <span className="font-semibold">{extras.legByes}</span></div>
        <div>Pen: <span className="font-semibold">{extras.penalties}</span></div>
        <div>Total: <span className="font-semibold">{extras.total}</span></div>
      </div>
    </div>
  );
}

