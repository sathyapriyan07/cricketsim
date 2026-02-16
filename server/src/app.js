import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { competitionRouter } from "./routes/competition.js";
import { competitionsRouter } from "./routes/competitions.js";
import { matchesRouter } from "./routes/matches.js";
import { playersRouter } from "./routes/players.js";
import { rankingsRouter } from "./routes/rankings.js";
import { teamsRouter } from "./routes/teams.js";
import { tournamentsRouter } from "./routes/tournaments.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true, service: "cricketsim-api" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/players", playersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/tournaments", tournamentsRouter);
app.use("/api/competitions", competitionsRouter);
app.use("/api/competition", competitionRouter);
app.use("/api/rankings", rankingsRouter);
app.use("/api", matchesRouter);

export default app;

