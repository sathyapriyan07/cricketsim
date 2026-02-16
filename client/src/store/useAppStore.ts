import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CompetitionType, MatchEvent, Player, Ranking, Team } from "lib/types";

interface AppState {
  players: Player[];
  teams: Team[];
  rankings: Ranking[];
  matchEvents: MatchEvent[];
  selectedCompetition: string | null;
  selectedTeam: string | null;
  competitionType: CompetitionType | null;
  selectedFormat: string | null;
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  setRankings: (rankings: Ranking[]) => void;
  setSelectedCompetition: (competitionId: string | null) => void;
  setSelectedTeam: (teamId: string | null) => void;
  setCompetitionType: (type: CompetitionType | null) => void;
  setSelectedFormat: (format: string | null) => void;
  resetCompetitionSelection: () => void;
  pushMatchEvent: (event: MatchEvent) => void;
  resetMatchEvents: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      players: [],
      teams: [],
      rankings: [],
      matchEvents: [],
      selectedCompetition: null,
      selectedTeam: null,
      competitionType: null,
      selectedFormat: null,
      setPlayers: (players) => set({ players }),
      setTeams: (teams) => set({ teams }),
      setRankings: (rankings) => set({ rankings }),
      setSelectedCompetition: (selectedCompetition) => set({ selectedCompetition }),
      setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
      setCompetitionType: (competitionType) => set({ competitionType }),
      setSelectedFormat: (selectedFormat) => set({ selectedFormat }),
      resetCompetitionSelection: () => set({ selectedCompetition: null, selectedTeam: null, competitionType: null, selectedFormat: null }),
      pushMatchEvent: (event) => set((state) => ({ matchEvents: [...state.matchEvents, event] })),
      resetMatchEvents: () => set({ matchEvents: [] })
    }),
    {
      name: "cricketsim-app-store",
      partialize: (state) => ({
        selectedCompetition: state.selectedCompetition,
        selectedTeam: state.selectedTeam,
        competitionType: state.competitionType,
        selectedFormat: state.selectedFormat
      })
    }
  )
);

