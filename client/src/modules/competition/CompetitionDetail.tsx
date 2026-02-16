import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GlassCard } from "components/GlassCard";
import { CompetitionType } from "lib/types";
import { useAppStore } from "store/useAppStore";
import { useCompetitionStore as useGlobalCompetitionStore } from "store/competitionStore";
import { BracketView } from "./BracketView";
import { FixtureList } from "./FixtureList";
import { StandingsTable } from "./StandingsTable";
import { TeamSelect } from "./TeamSelect";
import { useCompetitionStore } from "./competitionStore";
import { useCompetition, usePlayCompetitionMatch } from "./competitionHooks";

type FixtureRow = {
  id: string;
  team_a_id?: string | null;
  team_b_id?: string | null;
  status?: string;
  result?: string | null;
  round?: number;
  round_name?: string;
  scheduled_at?: string;
};

export function CompetitionDetail({ type }: { type: CompetitionType }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { teams, setSelectedCompetition, setSelectedTeam, setCompetitionType, setSelectedFormat } = useAppStore();
  const {
    setSelectedCompetition: setSelectedCompetitionPersisted,
    setSelectedTeam: setSelectedTeamPersisted,
    setCompetitionType: setCompetitionTypePersisted,
    setSelectedFormat: setSelectedFormatPersisted
  } = useGlobalCompetitionStore();
  const { selectedFixtureId, setSelectedFixtureId, showCompletedFixtures, toggleShowCompletedFixtures } = useCompetitionStore();
  const { competition, loading, error } = useCompetition(id);
  const { playMatch, loading: playingFixture, error: playError } = usePlayCompetitionMatch(id);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState("");

  const teamMap = useMemo(() => {
    return Object.fromEntries(teams.map((team) => [team.id, team]));
  }, [teams]);

  const competitionTeams = useMemo(() => {
    if (!competition) return [];
    const allowedIds = new Set(competition.team_ids || []);
    return teams.filter((team) => allowedIds.has(team.id));
  }, [competition, teams]);

  const fixtures = useMemo(() => {
    const rows = (competition?.fixtures_json || competition?.schedule_json || []) as FixtureRow[];
    return rows.map((fixture) => ({
      ...fixture,
      team_a_name: fixture.team_a_id ? teamMap[fixture.team_a_id]?.name : "TBD",
      team_b_name: fixture.team_b_id ? teamMap[fixture.team_b_id]?.name : "TBD"
    }));
  }, [competition, teamMap]);

  const standings = useMemo(() => {
    return Array.isArray(competition?.standings_json) ? competition.standings_json : [];
  }, [competition]);

  const currentMatchId = useMemo(() => {
    const stats = competition?.stats_json as { current_match_id?: string } | undefined;
    return stats?.current_match_id || null;
  }, [competition]);

  const progress = useMemo(() => {
    const total = fixtures.length;
    const completed = fixtures.filter((fixture) => fixture.status === "completed").length;
    return { total, completed };
  }, [fixtures]);

  async function handlePlayFixture(fixtureId: string) {
    if (!competition) return;
    try {
      setSelectedFixtureId(fixtureId);
      setActionStatus("Playing fixture...");
      const response = await playMatch(fixtureId, selectedTeamId);
      setActionStatus(`${response.result}${response.auto_simulated ? " (auto-simulated)" : ""}`);
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "Failed to play fixture");
    }
  }

  function continueToPlayingXI() {
    if (!competition || !selectedTeamId) return;
    setSelectedCompetition(competition.id);
    setSelectedTeam(selectedTeamId);
    setCompetitionType(type);
    setSelectedFormat(competition.format);
    setSelectedCompetitionPersisted(competition.id);
    setSelectedTeamPersisted(selectedTeamId);
    setCompetitionTypePersisted(type);
    setSelectedFormatPersisted(competition.format);
    navigate("/playing-xi");
  }

  if (loading) return <GlassCard>Loading competition...</GlassCard>;
  if (error || !competition) return <GlassCard className="text-red-600">{error || "Competition not found."}</GlassCard>;

  const stats = (competition.stats_json || {}) as Record<string, any>;
  const orangeCap = stats.orangeCap || null;
  const purpleCap = stats.purpleCap || null;

  return (
    <div className="space-y-4">
      <GlassCard className="border border-gray-200">
        <h1 className="text-2xl font-semibold">{competition.name}</h1>
        <p className="mt-2 text-sm text-gray-600">Type: {competition.type} | Format: {competition.format}</p>
        <p className="text-sm text-gray-600">Progress: {progress.completed}/{progress.total} fixtures completed</p>
        <p className="text-sm text-gray-600">Status: {competition.status || "scheduled"} {competition.winner ? `| Winner: ${teamMap[competition.winner]?.name || competition.winner}` : ""}</p>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <GlassCard>
            <TeamSelect teams={competitionTeams} selectedTeamId={selectedTeamId} onSelect={setSelectedTeamId} />
            <button
              disabled={!selectedTeamId}
              onClick={continueToPlayingXI}
              className="btn-primary mt-4 w-full py-3"
            >
              Continue To Playing XI
            </button>
          </GlassCard>

          <FixtureList
            fixtures={fixtures}
            selectedFixtureId={selectedFixtureId}
            onSelect={setSelectedFixtureId}
            onPlay={handlePlayFixture}
            showCompleted={showCompletedFixtures}
            playingFixtureId={playingFixture ? selectedFixtureId : null}
          />
        </div>

        <GlassCard className="space-y-3">
          <h3 className="text-lg font-semibold">Competition Controls</h3>
          <button className="btn-secondary w-full" onClick={toggleShowCompletedFixtures}>
            {showCompletedFixtures ? "Hide Completed Fixtures" : "Show Completed Fixtures"}
          </button>
          <button
            className="btn-primary w-full"
            disabled={!currentMatchId || playingFixture}
            onClick={() => currentMatchId && handlePlayFixture(currentMatchId)}
          >
            Resume Competition
          </button>
          <p className="text-xs text-gray-500">Current Fixture: {currentMatchId || "None"}</p>
          {orangeCap && (
            <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
              Orange Cap: {orangeCap.id} ({orangeCap.value})
            </p>
          )}
          {purpleCap && (
            <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700">
              Purple Cap: {purpleCap.id} ({purpleCap.value})
            </p>
          )}
          {(actionStatus || playError) && (
            <p className="text-sm text-gray-700">{playError || actionStatus}</p>
          )}
        </GlassCard>
      </div>

      {!!standings.length && <StandingsTable standings={standings as Array<Record<string, any>>} />}
      <BracketView bracket={competition.bracket_json as Record<string, any> | null} fixtures={fixtures} />
    </div>
  );
}
