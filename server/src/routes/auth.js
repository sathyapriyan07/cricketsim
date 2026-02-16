import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({
    id: req.user.id,
    email: req.user.email,
    role: String(req.user.role || "").toLowerCase(),
    display_name: req.user.display_name,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: String(req.user.role || "").toLowerCase(),
      display_name: req.user.display_name
    }
  });
});

authRouter.put("/me", requireAuth, async (req, res) => {
  const nextDisplayName = String(req.body.display_name || req.body.name || "").trim();
  if (!nextDisplayName) {
    return res.status(400).json({ error: "display_name is required" });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name: nextDisplayName })
    .eq("id", req.user.id)
    .select("id, name, email, role")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({
    id: data.id,
    email: data.email,
    role: String(data.role || "").toLowerCase(),
    display_name: data.name,
    user: {
      id: data.id,
      email: data.email,
      role: String(data.role || "").toLowerCase(),
      display_name: data.name
    }
  });
});

