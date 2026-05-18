import type { NextFunction, Request, Response } from "express";
import { getTokenFromRequest, verifyAdminToken, type AdminTokenPayload } from "../lib/auth.js";

export type AdminRequest = Request & { admin?: AdminTokenPayload };

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }

  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired admin session" });
  }
}
