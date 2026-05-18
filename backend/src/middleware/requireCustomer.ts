import type { NextFunction, Request, Response } from "express";
import {
  getCustomerTokenFromRequest,
  verifyCustomerToken,
  type CustomerTokenPayload,
} from "../lib/customerAuth.js";

export type CustomerRequest = Request & { customer?: CustomerTokenPayload };

export function requireCustomer(
  req: CustomerRequest,
  res: Response,
  next: NextFunction,
) {
  const token = getCustomerTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Login required" });
    return;
  }

  try {
    req.customer = verifyCustomerToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
