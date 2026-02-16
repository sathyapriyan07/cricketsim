import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

authRouter.put("/me", requireAuth, async (req, res) => {
  const nextName = String(req.body.name || "").trim();
  if (!nextName) {
    return res.status(400).json({ error: "Name is required" });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name: nextName })
    .eq("id", req.user.id)
    .select("id, name, email, role")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ user: data });
});
