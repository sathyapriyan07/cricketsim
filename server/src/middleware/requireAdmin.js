export function requireAdmin(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();
  if (role !== "admin" && role !== "moderator") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

export function requireSuperAdmin(req, res, next) {
  const role = String(req.user?.role || "").toLowerCase();
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

