import { ReactNode } from "react";

export interface StatsColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

export interface StatsRow {
  id: string;
  values: Record<string, ReactNode>;
}

export function StatsTable({ title, columns, rows }: { title: string; columns: StatsColumn[]; rows: StatsRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-700">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                    column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                {columns.map((column) => (
                  <td
                    key={`${row.id}-${column.key}`}
                    className={`whitespace-nowrap px-3 py-2 ${
                      column.align === "right" ? "text-right" : column.align === "center" ? "text-center" : "text-left"
                    } ${column.key === "r" || column.key === "w" ? "font-semibold text-slate-900" : ""}`}
                  >
                    {row.values[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="mt-2 text-sm text-slate-500">No stats available.</p>}
    </div>
  );
}
