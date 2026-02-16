import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authGuard.js";
import { approveTeam, createTeam, listTeams, updateTeam } from "../services/teamService.js";

export const teamsRouter = Router();

teamsRouter.get("/", async (_req, res) => {
  const { data, error } = await listTeams();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

teamsRouter.post("/", requireAuth, async (req, res) => {
  const { data, error } = await createTeam(req.body, req.user.role);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

teamsRouter.put("/:id", requireAuth, requireRole("ADMIN", "MODERATOR"), async (req, res) => {
  const { data, error } = await updateTeam(req.params.id, req.body);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

teamsRouter.patch("/:id/approve", requireAuth, requireRole("ADMIN", "MODERATOR"), async (req, res) => {
  const { data, error } = await approveTeam(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

