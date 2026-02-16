import { Router } from "express";
import { requireAdmin, requireAuth, requireSuperAdmin } from "../middleware/authGuard.js";
import { createPlayer, deletePlayer, listPlayers, updatePlayer } from "../services/playerService.js";

export const playersRouter = Router();

playersRouter.get("/", async (_req, res) => {
  const { data, error } = await listPlayers();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

playersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await createPlayer(req.body);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

playersRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await updatePlayer(req.params.id, req.body);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

playersRouter.delete("/:id", requireAuth, requireSuperAdmin, async (req, res) => {
  const { error } = await deletePlayer(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(204).send();
});
