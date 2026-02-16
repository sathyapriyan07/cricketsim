import { StatsColumn, StatsRow, StatsTable } from "./StatsTable";

const bowlingColumns: StatsColumn[] = [
  { key: "format", label: "Format" },
  { key: "mat", label: "Mat", align: "right" },
  { key: "inn", label: "Inn", align: "right" },
  { key: "w", label: "W", align: "right" },
  { key: "econ", label: "Econ", align: "right" },
  { key: "avg", label: "Avg", align: "right" },
  { key: "best", label: "Best", align: "right" },
  { key: "threeW", label: "3W", align: "right" },
  { key: "fiveW", label: "5W", align: "right" },
  { key: "sr", label: "SR", align: "right" }
];

export function BowlingTable({ rows }: { rows: StatsRow[] }) {
  return <StatsTable title="Bowling Stats" columns={bowlingColumns} rows={rows} />;
}
