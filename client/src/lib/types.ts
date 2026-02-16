export type Role = "BAT" | "BOWL" | "AR" | "WK";

export interface Player {
  id: string;
  name: string;
  role: Role;
  image_url?: string;
  batting_stats_json?: Record<string, unknown>;
  bowling_stats_json?: Record<string, unknown>;
  fielding_stats_json?: Record<string, unknown>;
  career_stats_json?: Record<string, unknown>;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  squad_player_ids: string[];
  approved?: boolean;
}

export interface Ranking {
  id: string;
  category: "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "TEAM";
  player_id?: string;
  team_id?: string;
  points: number;
}

export interface MatchEvent {
  ball: string;
  outcome: string;
  runs: number;
  wicket: boolean;
  commentary: string;
}

export type CompetitionType = "tournament" | "series" | "league";

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  format: string;
  team_ids: string[];
  fixtures_json?: Array<Record<string, unknown>>;
  schedule_json: Array<Record<string, unknown>>;
  standings_json: Array<Record<string, unknown>>;
  bracket_json?: Record<string, unknown> | null;
  stats_json?: Record<string, unknown>;
  current_round?: number;
  winner?: string | null;
  status?: string;
  created_by?: string;
  created_at: string;
}
