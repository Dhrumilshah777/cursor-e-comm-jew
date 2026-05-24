import { Router } from "express";
import { adminCookieName, adminCookieOptions } from "../../lib/auth.js";
import { getAdminById, loginAdmin } from "../../services/adminAuth.js";
import { requireAdmin, type AdminRequest } from "../../middleware/requireAdmin.js";
import { createRateLimiter, ipKey } from "../../middleware/rateLimit.js";

export const adminAuthRouter = Router();

const adminLoginLimiter = createRateLimiter({
  name: "admin-login",
  windowSeconds: 15 * 60,
  max: 10,
  keys: [ipKey("admin-login")],
  message:
    "Too many login attempts. Please wait 15 minutes before trying again.",
});

adminAuthRouter.post("/login", adminLoginLimiter, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const result = await loginAdmin(email, password);
    if (!result) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    res.cookie(adminCookieName, result.token, adminCookieOptions());
    res.json({ admin: result.admin, token: result.token });
  } catch (error) {
    console.error("POST /api/admin/auth/login failed:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

adminAuthRouter.get("/me", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const admin = await getAdminById(req.admin!.adminId);
    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }
    res.json({ admin });
  } catch (error) {
    console.error("GET /api/admin/auth/me failed:", error);
    res.status(500).json({ error: "Failed to load admin profile" });
  }
});

adminAuthRouter.post("/logout", (_req, res) => {
  res.clearCookie(adminCookieName, { path: "/" });
  res.json({ ok: true });
});
