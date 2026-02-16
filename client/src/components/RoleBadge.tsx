import { Role } from "lib/types";

const roleColors: Record<Role, string> = {
  BAT: "bg-blue-100 text-blue-700",
  BOWL: "bg-orange-100 text-orange-700",
  AR: "bg-emerald-100 text-emerald-700",
  WK: "bg-violet-100 text-violet-700"
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleColors[role]}`}>{role}</span>;
}
