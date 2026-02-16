import { create } from "zustand";

interface CompetitionUiState {
  selectedFixtureId: string | null;
  setSelectedFixtureId: (fixtureId: string | null) => void;
  showCompletedFixtures: boolean;
  toggleShowCompletedFixtures: () => void;
}

export const useCompetitionStore = create<CompetitionUiState>((set) => ({
  selectedFixtureId: null,
  setSelectedFixtureId: (selectedFixtureId) => set({ selectedFixtureId }),
  showCompletedFixtures: true,
  toggleShowCompletedFixtures: () => set((state) => ({ showCompletedFixtures: !state.showCompletedFixtures }))
}));
