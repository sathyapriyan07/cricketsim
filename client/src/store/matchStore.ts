import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CompetitionType, MatchEvent } from "lib/types";

export interface MatchSetupState {
  competitionId: string | null;
  competitionType: CompetitionType | null;
  format: string | null;
  teamId: string | null;
  opponentTeamId: string | null;
  playingXI: string[];
  captainId: string | null;
  viceCaptainId: string | null;
}

interface MatchStoreState {
  matchEvents: MatchEvent[];
  matchSetup: MatchSetupState;
  pushMatchEvent: (event: MatchEvent) => void;
  resetMatchEvents: () => void;
  setMatchEvents: (events: MatchEvent[]) => void;
  setMatchSetup: (setup: Partial<MatchSetupState>) => void;
  resetMatchSetup: () => void;
}

const initialSetup: MatchSetupState = {
  competitionId: null,
  competitionType: null,
  format: null,
  teamId: null,
  opponentTeamId: null,
  playingXI: [],
  captainId: null,
  viceCaptainId: null
};

export const useMatchStore = create<MatchStoreState>()(
  persist(
    (set) => ({
      matchEvents: [],
      matchSetup: initialSetup,
      pushMatchEvent: (event) => set((state) => ({ matchEvents: [...state.matchEvents, event] })),
      resetMatchEvents: () => set({ matchEvents: [] }),
      setMatchEvents: (matchEvents) => set({ matchEvents }),
      setMatchSetup: (setup) => set((state) => ({ matchSetup: { ...state.matchSetup, ...setup } })),
      resetMatchSetup: () => set({ matchSetup: initialSetup })
    }),
    {
      name: "cricketsim-match-store",
      partialize: (state) => ({ matchSetup: state.matchSetup })
    }
  )
);
