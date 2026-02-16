import { StatsColumn, StatsRow, StatsTable } from "./StatsTable";

const battingColumns: StatsColumn[] = [
  { key: "format", label: "Format" },
  { key: "mat", label: "Mat", align: "right" },
  { key: "inn", label: "Inn", align: "right" },
  { key: "r", label: "R", align: "right" },
  { key: "hundreds", label: "100s", align: "right" },
  { key: "fifties", label: "50s", align: "right" },
  { key: "hs", label: "HS", align: "right" },
  { key: "sr", label: "SR", align: "right" },
  { key: "avg", label: "Avg", align: "right" },
  { key: "fours", label: "4s", align: "right" },
  { key: "sixes", label: "6s", align: "right" }
];

export function BattingTable({ rows }: { rows: StatsRow[] }) {
  return <StatsTable title="Batting Stats" columns={battingColumns} rows={rows} />;
}
