import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CompetitionType } from "lib/types";

interface CompetitionStoreState {
  selectedCompetition: string | null;
  selectedTeam: string | null;
  competitionType: CompetitionType | null;
  selectedFormat: string | null;
  setSelectedCompetition: (competitionId: string | null) => void;
  setSelectedTeam: (teamId: string | null) => void;
  setCompetitionType: (type: CompetitionType | null) => void;
  setSelectedFormat: (format: string | null) => void;
  resetCompetitionSelection: () => void;
}

export const useCompetitionStore = create<CompetitionStoreState>()(
  persist(
    (set) => ({
      selectedCompetition: null,
      selectedTeam: null,
      competitionType: null,
      selectedFormat: null,
      setSelectedCompetition: (selectedCompetition) => set({ selectedCompetition }),
      setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
      setCompetitionType: (competitionType) => set({ competitionType }),
      setSelectedFormat: (selectedFormat) => set({ selectedFormat }),
      resetCompetitionSelection: () =>
        set({
          selectedCompetition: null,
          selectedTeam: null,
          competitionType: null,
          selectedFormat: null
        })
    }),
    {
      name: "cricketsim-competition-store"
    }
  )
);

