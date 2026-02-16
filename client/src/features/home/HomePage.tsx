import { motion } from "framer-motion";
import { GlassCard } from "components/GlassCard";
import { Link } from "react-router-dom";
import { useAppStore } from "store/useAppStore";

const modes = [
  { title: "Quick Match", href: "/quick-match" },
  { title: "League", href: "/league" },
  { title: "Tournament", href: "/tournament" },
  { title: "Series", href: "/series" },
  { title: "Career Mode", href: "/career" }
];

export function HomePage() {
  const { players, teams, rankings } = useAppStore();

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-8">
        <motion.h1
          className="text-3xl font-bold md:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Command The Match. Build The Dynasty.
        </motion.h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Simulate ball-by-ball cricket with strategy, weather, pitch dynamics, fatigue, injuries, and live rankings.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {modes.map((mode, idx) => (
            <motion.div key={mode.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
              <Link to={mode.href} className="block rounded-lg border border-gray-300 bg-white p-3 text-center text-gray-700 hover:bg-gray-50">
                {mode.title}
              </Link>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Featured Players</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {players.slice(0, 8).map((player) => (
              <Link key={player.id} to={`/players/${player.id}`} className="min-w-40 rounded-xl bg-gray-100 p-3">
                <div className="text-sm text-gray-500">{player.role}</div>
                <div className="font-medium">{player.name}</div>
              </Link>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Featured Teams</h2>
          <div className="space-y-2">
            {teams.slice(0, 6).map((team) => (
              <div key={team.id} className="rounded-xl bg-gray-100 p-3">
                {team.name}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-3 text-lg font-semibold">Rankings Preview</h2>
          <div className="space-y-2">
            {rankings.slice(0, 6).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-gray-100 p-3">
                <span>{r.category}</span>
                <span className="text-blue-600">{r.points}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
