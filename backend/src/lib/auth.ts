import jwt from "jsonwebtoken";
import type { Request } from "express";

const COOKIE_NAME = "admin_token";

export type AdminTokenPayload = {
  adminId: string;
  email: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in .env");
  }
  return secret;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
}

export function getTokenFromRequest(req: Request): string | null {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const adminCookieName = COOKIE_NAME;

function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function adminCookieOptions() {
  const production = isProductionEnv();
  return {
    httpOnly: true,
    secure: production,
    sameSite: (production ? "none" : "lax") as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
