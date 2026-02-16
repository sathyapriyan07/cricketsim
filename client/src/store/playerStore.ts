import { create } from "zustand";
import { Player, Ranking, Team } from "lib/types";

interface PlayerStoreState {
  players: Player[];
  teams: Team[];
  rankings: Ranking[];
  setPlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  setRankings: (rankings: Ranking[]) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  players: [],
  teams: [],
  rankings: [],
  setPlayers: (players) => set({ players }),
  setTeams: (teams) => set({ teams }),
  setRankings: (rankings) => set({ rankings })
}));

