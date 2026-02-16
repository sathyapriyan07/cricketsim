export function validatePlayingXI(players) {
  if (!Array.isArray(players) || players.length !== 11) {
    return { valid: false, message: "Playing XI must include exactly 11 players" };
  }

  const wk = players.filter((p) => p.role === "WK").length;
  const bowlers = players.filter((p) => p.role === "BOWL").length;
  const allRounders = players.filter((p) => p.role === "AR").length;

  if (wk < 1) return { valid: false, message: "Minimum 1 wicketkeeper required" };
  if (bowlers < 3 || bowlers > 5) return { valid: false, message: "Bowlers must be between 3 and 5" };
  if (allRounders < 1 || allRounders > 3) return { valid: false, message: "All-rounders must be between 1 and 3" };

  return { valid: true };
}
