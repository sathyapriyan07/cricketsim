import { Router } from "express";
import { listRankings } from "../services/rankingService.js";

export const rankingsRouter = Router();

rankingsRouter.get("/", async (_req, res) => {
  const { data, error } = await listRankings();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

