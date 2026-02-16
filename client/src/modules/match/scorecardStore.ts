import { create } from "zustand";

export interface BattingRow {
  batter: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissalType: string;
  bowler?: string | null;
  fielder?: string | null;
}

export interface BowlingRow {
  bowler: string;
  overs: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  noBalls: number;
  wides: number;
}

export interface FallRow {
  wicketNo: number;
  score: string;
  over: string | null;
  batsman: string;
}

export interface OverRow {
  over: number;
  runs: number;
  wickets: number;
  balls: string[];
  scoreAfterOver: string;
}

export interface InningsScorecard {
  inningsNo: number;
  team: string;
  totalRuns: number;
  wickets: number;
  overs: string;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalties: number;
    total: number;
  };
  batting: BattingRow[];
  bowling: BowlingRow[];
  fallOfWickets: FallRow[];
  overSummary: OverRow[];
}

export interface MatchScorecard {
  format: string;
  venue?: string | null;
  result: string;
  innings: InningsScorecard[];
}

type LiveEvent = {
  innings?: number;
  ball?: string;
  runs?: number;
  wicket?: boolean;
  legalBall?: boolean;
  extraType?: string | null;
  batsman?: string | null;
  bowler?: string | null;
  dismissalType?: string | null;
  fielder?: string | null;
};

function nextOverText(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function initInnings(inningsNo: number, team = `Team ${inningsNo}`): InningsScorecard {
  return {
    inningsNo,
    team,
    totalRuns: 0,
    wickets: 0,
    overs: "0.0",
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0, total: 0 },
    batting: [],
    bowling: [],
    fallOfWickets: [],
    overSummary: []
  };
}

function ballToOverNo(ball?: string) {
  const whole = Number(String(ball || "0.1").split(".")[0] || 0);
  return whole + 1;
}

function findOrCreateBattingRow(innings: InningsScorecard, batterName: string) {
  const found = innings.batting.find((row) => row.batter === batterName);
  if (found) return found;
  const row: BattingRow = {
    batter: batterName,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    dismissalType: "not out",
    bowler: null,
    fielder: null
  };
  innings.batting.push(row);
  return row;
}

function findOrCreateBowlingRow(innings: InningsScorecard, bowlerName: string) {
  const found = innings.bowling.find((row) => row.bowler === bowlerName);
  if (found) return found;
  const row: BowlingRow = {
    bowler: bowlerName,
    overs: "0.0",
    maidens: 0,
    runsConceded: 0,
    wickets: 0,
    economy: 0,
    noBalls: 0,
    wides: 0
  };
  innings.bowling.push(row);
  return row;
}

function pushBallToOver(innings: InningsScorecard, event: LiveEvent) {
  const overNo = ballToOverNo(event.ball);
  let over = innings.overSummary.find((row) => row.over === overNo);
  if (!over) {
    over = {
      over: overNo,
      runs: 0,
      wickets: 0,
      balls: [],
      scoreAfterOver: `${innings.totalRuns}/${innings.wickets}`
    };
    innings.overSummary.push(over);
  }

  const runs = Number(event.runs || 0);
  over.runs += runs;
  if (event.wicket) over.wickets += 1;
  over.balls.push(event.wicket ? "W" : event.extraType ? `${runs}${String(event.extraType).charAt(0).toUpperCase()}` : String(runs));
  over.scoreAfterOver = `${innings.totalRuns}/${innings.wickets}`;
}

function rebuildBowlerDerived(row: BowlingRow) {
  const [whole, part] = String(row.overs).split(".");
  const balls = Number(whole || 0) * 6 + Number(part || 0);
  const overs = balls / 6 || 1;
  row.economy = Number((row.runsConceded / overs).toFixed(2));
}

function incrementBowlerBall(row: BowlingRow) {
  const [whole, part] = String(row.overs).split(".");
  const balls = Number(whole || 0) * 6 + Number(part || 0) + 1;
  row.overs = `${Math.floor(balls / 6)}.${balls % 6}`;
}

interface ScorecardState {
  scorecard: MatchScorecard | null;
  currentInnings: number;
  isLive: boolean;
  setCurrentInnings: (innings: number) => void;
  setLive: (live: boolean) => void;
  resetScorecard: () => void;
  startScorecard: (input: { format?: string; teams?: string[]; result?: string; venue?: string | null }) => void;
  setScorecard: (scorecard: MatchScorecard | null) => void;
  appendEvent: (event: LiveEvent) => void;
}

export const useScorecardStore = create<ScorecardState>((set) => ({
  scorecard: null,
  currentInnings: 1,
  isLive: false,
  setCurrentInnings: (currentInnings) => set({ currentInnings }),
  setLive: (isLive) => set({ isLive }),
  resetScorecard: () => set({ scorecard: null, currentInnings: 1, isLive: false }),
  startScorecard: ({ format = "T20", teams = ["Team A"], result = "", venue = null }) =>
    set({
      isLive: true,
      currentInnings: 1,
      scorecard: {
        format,
        result,
        venue,
        innings: teams.map((team, idx) => ({ ...initInnings(idx + 1, team) }))
      }
    }),
  setScorecard: (scorecard) => set({ scorecard }),
  appendEvent: (event) =>
    set((state) => {
      const current = state.scorecard;
      if (!current) return state;

      const inningsNo = Number(event.innings || 1);
      while (current.innings.length < inningsNo) {
        current.innings.push(initInnings(current.innings.length + 1));
      }

      const innings = current.innings[inningsNo - 1];
      const runs = Number(event.runs || 0);
      const legalBall = event.legalBall !== false;
      const batterName = event.batsman || "Batsman";
      const bowlerName = event.bowler || "Bowler";

      innings.totalRuns += runs;
      if (event.wicket) innings.wickets += 1;

      const batter = findOrCreateBattingRow(innings, batterName);
      const bowler = findOrCreateBowlingRow(innings, bowlerName);

      if (legalBall) {
        batter.balls += 1;
        incrementBowlerBall(bowler);
      }

      const isByeType = event.extraType === "bye" || event.extraType === "leg-bye" || event.extraType === "legbye";
      if (!isByeType) {
        batter.runs += runs;
        if (runs === 4) batter.fours += 1;
        if (runs === 6) batter.sixes += 1;
      }

      bowler.runsConceded += runs;
      if (event.wicket) bowler.wickets += 1;
      if (event.extraType === "wide") innings.extras.wides += runs || 1;
      if (event.extraType === "no-ball" || event.extraType === "noball") innings.extras.noBalls += runs || 1;
      if (event.extraType === "bye") innings.extras.byes += runs;
      if (event.extraType === "leg-bye" || event.extraType === "legbye") innings.extras.legByes += runs;
      innings.extras.total = innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes + innings.extras.penalties;

      batter.strikeRate = batter.balls ? Number(((batter.runs / batter.balls) * 100).toFixed(2)) : 0;
      rebuildBowlerDerived(bowler);

      if (event.wicket) {
        batter.dismissalType = event.dismissalType || "out";
        batter.bowler = bowlerName;
        batter.fielder = event.fielder || null;
        innings.fallOfWickets.push({
          wicketNo: innings.wickets,
          score: `${innings.totalRuns}/${innings.wickets}`,
          over: event.ball || null,
          batsman: batterName
        });
      }

      const legalBalls = innings.bowling.reduce((sum, row) => {
        const [whole, part] = String(row.overs).split(".");
        return sum + Number(whole || 0) * 6 + Number(part || 0);
      }, 0);
      innings.overs = nextOverText(legalBalls);
      pushBallToOver(innings, event);

      return { ...state, scorecard: { ...current } };
    })
}));

