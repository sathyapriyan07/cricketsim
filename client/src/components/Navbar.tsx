import { Home, Swords, ShieldCheck, Trophy, UserRound, Radar, Gauge } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/quick-match", label: "Quick Match", icon: Swords },
  { to: "/league", label: "League", icon: Trophy },
  { to: "/tournament", label: "Tournament", icon: ShieldCheck },
  { to: "/career", label: "Career", icon: UserRound },
  { to: "/rankings", label: "Rankings", icon: Radar },
  { to: "/admin", label: "Admin", icon: Gauge }
];

export function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2">
        <div className="mr-4 text-lg font-semibold text-[#0A1F44]">CricketSim</div>
        {links.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-lg border-b-2 px-3 py-1.5 text-sm transition ${
                active ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} />
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
