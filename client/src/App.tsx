import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "components/AppLayout";
import { AdminDashboardPage } from "features/admin/AdminDashboardPage";
import { CareerStatsPage } from "features/career/CareerStatsPage";
import { HomePage } from "features/home/HomePage";
import { RankingsPage } from "features/home/RankingsPage";
import { MatchSimulatorPage } from "features/match/MatchSimulatorPage";
import { TeamSelectionPage } from "features/match/TeamSelectionPage";
import { PlayerProfilePage } from "features/players/PlayerProfilePage";
import { CompetitionDetail } from "modules/competition/CompetitionDetail";
import { CompetitionList } from "modules/competition/CompetitionList";
import { Player, Ranking, Team } from "lib/types";
import { useAppStore } from "store/useAppStore";
import { usePlayerStore } from "store/playerStore";
import { apiFetch } from "services/api";
import { supabase } from "services/supabase";

export default function App() {
  const { setPlayers, setTeams, setRankings } = useAppStore();
  const {
    setPlayers: setPlayersDomain,
    setTeams: setTeamsDomain,
    setRankings: setRankingsDomain
  } = usePlayerStore();

  useEffect(() => {
    apiFetch<Player[]>("/players")
      .then((data) => {
        setPlayers(data);
        setPlayersDomain(data);
      })
      .catch(console.error);
    apiFetch<Team[]>("/teams")
      .then((data) => {
        setTeams(data);
        setTeamsDomain(data);
      })
      .catch(console.error);
    apiFetch<Ranking[]>("/rankings")
      .then((data) => {
        setRankings(data);
        setRankingsDomain(data);
      })
      .catch(console.error);

    const channel = supabase
      .channel("live-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "rankings" }, () => {
        apiFetch<Ranking[]>("/rankings")
          .then((data) => {
            setRankings(data);
            setRankingsDomain(data);
          })
          .catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setPlayers, setPlayersDomain, setTeams, setTeamsDomain, setRankings, setRankingsDomain]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quick-match" element={<TeamSelectionPage />} />
        <Route path="/playing-xi" element={<TeamSelectionPage />} />
        <Route path="/simulate" element={<MatchSimulatorPage />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />
        <Route path="/career" element={<CareerStatsPage />} />
        <Route path="/league" element={<CompetitionList type="league" />} />
        <Route path="/league/:id" element={<CompetitionDetail type="league" />} />
        <Route path="/series" element={<CompetitionList type="series" />} />
        <Route path="/series/:id" element={<CompetitionDetail type="series" />} />
        <Route path="/tournament" element={<CompetitionList type="tournament" />} />
        <Route path="/tournament/:id" element={<CompetitionDetail type="tournament" />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

