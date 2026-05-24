import { Router } from "express";
import {
  getCustomerTokenFromRequest,
  verifyCustomerToken,
} from "../lib/customerAuth.js";
import {
  parseCancellationNote,
  parseCancellationReason,
} from "../lib/orderCancellation.js";
import { createRateLimiter, ipKey, userKey } from "../middleware/rateLimit.js";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import {
  cancelOrderForUser,
  OrderCancellationError,
} from "../services/orderCancellation.js";
import {
  getOrderByIdForPhone,
  getOrderByIdForUserId,
  getOrdersForPhone,
  getOrdersForUserId,
} from "../services/orders.js";

export const ordersRouter = Router();

const cancelOrderLimiter = createRateLimiter({
  name: "order-cancel",
  windowSeconds: 60 * 60,
  max: 10,
  keys: [userKey("order-cancel"), ipKey("order-cancel")],
  message: "Too many cancellation attempts. Please contact support if this is in error.",
});

function resolvePhone(queryPhone: unknown): string | null {
  if (typeof queryPhone === "string" && queryPhone.trim()) {
    return queryPhone.trim();
  }
  return process.env.DEMO_USER_PHONE?.trim() || null;
}

function resolveUserIdFromRequest(req: {
  headers: { authorization?: string; cookie?: string };
}): string | null {
  const token = getCustomerTokenFromRequest(req as Parameters<typeof getCustomerTokenFromRequest>[0]);
  if (!token) return null;
  try {
    return verifyCustomerToken(token).userId;
  } catch {
    return null;
  }
}

ordersRouter.get("/", async (req, res) => {
  const userId = resolveUserIdFromRequest(req);

  try {
    if (userId) {
      const orders = await getOrdersForUserId(userId);
      res.json({ orders });
      return;
    }

    const phone = resolvePhone(req.query.phone);
    if (!phone) {
      res.status(401).json({ error: "Login required" });
      return;
    }

    const orders = await getOrdersForPhone(phone);
    res.json({ orders });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

ordersRouter.post("/:orderId/cancel", requireCustomer, cancelOrderLimiter, async (req: CustomerRequest, res) => {
  const orderId = req.params.orderId;
  if (!orderId || Array.isArray(orderId)) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }

  const body = req.body as {
    reason?: unknown;
    note?: unknown;
    policyConfirmed?: unknown;
  };

  if (body.policyConfirmed !== true) {
    res.status(400).json({
      error: "You must confirm the cancellation policy.",
      code: "POLICY_NOT_CONFIRMED",
    });
    return;
  }

  const reason = parseCancellationReason(body.reason);
  if (!reason) {
    res.status(400).json({
      error: "Please select a reason for cancellation.",
      code: "INVALID_REASON",
    });
    return;
  }

  let note: string | null = null;
  try {
    note = parseCancellationNote(body.note);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid additional note.",
      code: "INVALID_NOTE",
    });
    return;
  }

  try {
    const result = await cancelOrderForUser(orderId, req.customer!.userId, { reason, note });
    res.json(result);
  } catch (error) {
    if (error instanceof OrderCancellationError) {
      const status =
        error.code === "ORDER_NOT_FOUND"
          ? 404
          : error.code === "REFUND_FAILED" || error.code === "REFUND_TOO_LOW"
            ? 422
            : 400;
      res.status(status).json({ error: error.message, code: error.code });
      return;
    }
    console.error(`POST /api/orders/${orderId}/cancel failed:`, error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

ordersRouter.get("/:orderId", async (req, res) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }

  const userId = resolveUserIdFromRequest(req);

  try {
    if (userId) {
      const order = await getOrderByIdForUserId(orderId, userId);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({ order });
      return;
    }

    const phone = resolvePhone(req.query.phone);
    if (!phone) {
      res.status(401).json({ error: "Login required" });
      return;
    }

    const order = await getOrderByIdForPhone(orderId, phone);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order });
  } catch (error) {
    console.error(`GET /api/orders/${orderId} failed:`, error);
    res.status(500).json({ error: "Failed to load order" });
  }
});
