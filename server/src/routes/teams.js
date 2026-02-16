import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/authGuard.js";
import { approveTeam, createTeam, listTeams, updateTeam } from "../services/teamService.js";

export const teamsRouter = Router();

teamsRouter.get("/", async (_req, res) => {
  const approvedParam = String(_req.query.approved || "").toLowerCase();
  const approvedOnly = approvedParam === "true" ? true : approvedParam === "false" ? false : null;
  const { data, error } = await listTeams(approvedOnly);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

teamsRouter.post("/", requireAuth, async (req, res) => {
  const { data, error } = await createTeam(req.body, req.user.role);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

teamsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await updateTeam(req.params.id, req.body);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

teamsRouter.patch("/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await approveTeam(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});
