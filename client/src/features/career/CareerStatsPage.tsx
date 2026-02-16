import { GlassCard } from "components/GlassCard";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { year: 2020, runs: 415, wickets: 12, strikeRate: 132 },
  { year: 2021, runs: 588, wickets: 15, strikeRate: 138 },
  { year: 2022, runs: 560, wickets: 19, strikeRate: 144 },
  { year: 2023, runs: 690, wickets: 21, strikeRate: 149 },
  { year: 2024, runs: 730, wickets: 18, strikeRate: 151 }
];

export function CareerStatsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Career Dashboard</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard><div className="text-sm text-gray-500">Runs</div><div className="text-3xl font-bold">6,920</div></GlassCard>
        <GlassCard><div className="text-sm text-gray-500">Wickets</div><div className="text-3xl font-bold">242</div></GlassCard>
        <GlassCard><div className="text-sm text-gray-500">Trophies</div><div className="text-3xl font-bold">11</div></GlassCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h2 className="mb-2 font-semibold">Runs vs Year</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data}><XAxis dataKey="year" /><YAxis /><Tooltip /><Line type="monotone" dataKey="runs" stroke="#38bdf8" strokeWidth={3} /></LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-2 font-semibold">Trophy Cabinet</h2>
          <div className="space-y-2 text-sm">
            <div className="rounded-xl bg-gray-100 p-2">3x League Winner</div>
            <div className="rounded-xl bg-gray-100 p-2">2x Tournament MVP</div>
            <div className="rounded-xl bg-gray-100 p-2">6x POTM Awards</div>
          </div>
        </GlassCard>
      </div>
      <GlassCard>
        <h2 className="mb-2 font-semibold">Wickets & Strike Rate Trend</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data}><XAxis dataKey="year" /><YAxis /><Tooltip /><Line type="monotone" dataKey="wickets" stroke="#22d3ee" strokeWidth={3} /><Line type="monotone" dataKey="strikeRate" stroke="#fb7185" strokeWidth={3} /></LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
