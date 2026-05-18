import jwt from "jsonwebtoken";
import type { Request } from "express";

const COOKIE_NAME = "customer_token";

export type CustomerTokenPayload = {
  userId: string;
  phone: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signCustomerToken(payload: CustomerTokenPayload): string {
  return jwt.sign({ ...payload, role: "customer" }, getJwtSecret(), {
    expiresIn: "30d",
  });
}

export function verifyCustomerToken(token: string): CustomerTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as CustomerTokenPayload & {
    role?: string;
  };
  return { userId: decoded.userId, phone: decoded.phone };
}

export function getCustomerTokenFromRequest(req: Request): string | null {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export const customerCookieName = COOKIE_NAME;

export function customerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function customerCookieClearOptions() {
  const { maxAge: _maxAge, ...options } = customerCookieOptions();
  return options;
}

export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  if (ten.length !== 10) {
    throw new Error("INVALID_PHONE");
  }
  return `+91${ten}`;
}
