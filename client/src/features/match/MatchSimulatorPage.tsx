import { useEffect, useMemo, useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "components/GlassCard";
import { Scorecard } from "modules/match/Scorecard";
import { useAppStore } from "store/useAppStore";
import { useCompetitionStore } from "store/competitionStore";
import { useMatchStore } from "store/matchStore";
import { apiFetch } from "services/api";
import { useScorecardStore } from "modules/match/scorecardStore";

const actions = ["block", "rotate", "strike", "loft"] as const;
type Action = (typeof actions)[number];

export function MatchSimulatorPage() {
  const { teams } = useAppStore();
  const { selectedCompetition, selectedTeam, selectedFormat } = useCompetitionStore();
  const { matchEvents, pushMatchEvent, resetMatchEvents, setMatchEvents, matchSetup } = useMatchStore();
  const {
    scorecard,
    currentInnings,
    setCurrentInnings,
    startScorecard,
    appendEvent,
    resetScorecard,
    setScorecard,
    setLive
  } = useScorecardStore();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<Action>("rotate");

  const competitionId = matchSetup.competitionId || selectedCompetition;
  const teamId = matchSetup.teamId || selectedTeam;
  const opponentTeamId = matchSetup.opponentTeamId || null;
  const format = matchSetup.format || selectedFormat || "T20";
  const teamMap = useMemo(() => Object.fromEntries(teams.map((team) => [team.id, team.name])), [teams]);
  const teamA = (teamId && teamMap[teamId]) || (teamId && `Team ${teamId.slice(0, 6)}`) || "Team A";
  const teamB = (opponentTeamId && teamMap[opponentTeamId]) || "Team B";

  useEffect(() => {
    if (!scorecard) {
      startScorecard({ format, teams: [teamA, teamB] });
    }
  }, [scorecard, startScorecard, format, teamA, teamB]);

  const scoreboard = useMemo(() => {
    const runs = matchEvents.reduce((acc, event) => acc + event.runs, 0);
    const wickets = matchEvents.filter((event) => event.wicket).length;
    const balls = matchEvents.length;
    const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
    return { runs, wickets, overs, balls };
  }, [matchEvents]);

  const wagonWheel = useMemo(() => {
    const bins = [
      { name: "Singles", value: matchEvents.filter((e) => e.runs === 1).length },
      { name: "Twos", value: matchEvents.filter((e) => e.runs === 2).length },
      { name: "Fours", value: matchEvents.filter((e) => e.runs === 4).length },
      { name: "Sixes", value: matchEvents.filter((e) => e.runs === 6).length },
      { name: "Dots", value: matchEvents.filter((e) => e.runs === 0 && !e.wicket).length },
      { name: "Wkts", value: matchEvents.filter((e) => e.wicket).length }
    ];
    return bins.filter((entry) => entry.value > 0);
  }, [matchEvents]);

  async function playBall(action: Action) {
    setLoading(true);
    try {
      const result = await apiFetch<{ event: any }>("/simulate-match", {
        method: "POST",
        body: JSON.stringify({ mode: "ball", action, pitchType: "flat", weather: "clear", competitionId, teamId, format, teamA, teamB })
      });
      pushMatchEvent(result.event);
      appendEvent(result.event);
      setLive(true);
    } finally {
      setLoading(false);
    }
  }

  async function fullOver() {
    setLoading(true);
    try {
      const result = await apiFetch<{ events: any[] }>("/simulate-match", {
        method: "POST",
        body: JSON.stringify({ mode: "auto", balls: 6, pitchType: "green", weather: "cloudy", competitionId, teamId, format, teamA, teamB })
      });
      result.events.forEach((event) => {
        pushMatchEvent(event);
        appendEvent(event);
      });
      setLive(true);
    } finally {
      setLoading(false);
    }
  }

  async function autoSim() {
    setLoading(true);
    try {
      const result = await apiFetch<{ events: any[] }>("/simulate-match", {
        method: "POST",
        body: JSON.stringify({ mode: "auto", balls: 24, pitchType: "dusty", weather: "humid", competitionId, teamId, format, teamA, teamB })
      });
      result.events.forEach((event) => {
        pushMatchEvent(event);
        appendEvent(event);
      });
      setLive(true);
    } finally {
      setLoading(false);
    }
  }

  function saveMatch() {
    localStorage.setItem("cricketsim_saved_match", JSON.stringify(matchEvents));
    localStorage.setItem("cricketsim_saved_scorecard", JSON.stringify(scorecard));
  }

  function resumeMatch() {
    const raw = localStorage.getItem("cricketsim_saved_match");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setMatchEvents(parsed);
      const savedScorecard = localStorage.getItem("cricketsim_saved_scorecard");
      if (savedScorecard) {
        setScorecard(JSON.parse(savedScorecard));
      }
    } catch {
      // ignore invalid payload
    }
  }

  const currentOver = matchEvents.slice(-6).map((event) => (event.wicket ? "W" : event.runs)).join(" ");

  return (
    <div className="space-y-4">
      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ball-by-Ball Simulator</h1>
        <div className="text-right">
          <div className="text-xs text-gray-500">
            {competitionId ? `Competition: ${competitionId.slice(0, 8)}...` : "Quick Match"} | {teamA} vs {teamB} | Format: {format}
          </div>
          <span className="text-blue-600">{scoreboard.runs}/{scoreboard.wickets}</span> ({scoreboard.overs})
        </div>
      </GlassCard>

      <GlassCard>
        <div className="grid gap-3 md:grid-cols-8">
          {actions.map((action) => (
            <button
              key={action}
              disabled={loading}
              onClick={() => {
                setStrategy(action);
                playBall(action);
              }}
              className={`rounded-lg border px-3 py-2 capitalize ${strategy === action ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {action}
            </button>
          ))}
          <button onClick={fullOver} disabled={loading} className="btn-primary">
            Full Over
          </button>
          <button onClick={autoSim} disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Auto Sim
          </button>
          <button onClick={saveMatch} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
            Save
          </button>
          <button onClick={resumeMatch} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Resume
          </button>
          <button
            onClick={() => {
              resetMatchEvents();
              resetScorecard();
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Reset
          </button>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Live Commentary</h2>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
            {matchEvents.slice().reverse().map((event, idx) => (
              <div key={`${event.ball}-${idx}`} className="rounded-lg bg-gray-100 p-3 text-sm">
                <div className="mb-1 text-blue-600">
                  {event.ball} - {event.outcome}
                </div>
                <div>{event.commentary}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="mb-2 text-lg font-semibold">Over Summary</h2>
          <p className="text-sm text-gray-600">Last over: {currentOver || "-"}</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={wagonWheel} dataKey="value" nameKey="name" innerRadius={36} outerRadius={70} fill="#38bdf8" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500">Wagon wheel proxy using scoring distribution.</p>
        </GlassCard>
      </div>

      {scorecard && <Scorecard scorecard={scorecard} currentInnings={currentInnings} onInningsChange={setCurrentInnings} />}
    </div>
  );
}
