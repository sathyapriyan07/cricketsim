import { supabase } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = authHeader.replace("Bearer ", "").trim();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid Supabase token" });
    }

    const authUser = data.user;
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", authUser.id)
      .maybeSingle();

    let userProfile = profile;

    if (!userProfile) {
      const fallbackName = authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User";
      const { data: createdProfile, error: createError } = await supabase
        .from("users")
        .upsert(
          {
            id: authUser.id,
            name: fallbackName,
            email: authUser.email,
            role: "USER"
          },
          { onConflict: "id" }
        )
        .select("id, name, email, role")
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }

      userProfile = createdProfile;
    }

    req.user = {
      id: authUser.id,
      email: authUser.email,
      role: userProfile.role,
      name: userProfile.name
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next();
  };
}
