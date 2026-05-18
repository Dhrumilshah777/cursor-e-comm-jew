import { Router } from "express";
import type { OrderStatus } from "../../generated/prisma/client.js";
import { parseOrderStatus } from "../../lib/format.js";
import {
  addOrderStatusEvent,
  getAdminOrderById,
  listAdminOrders,
  updateAdminOrder,
} from "../../services/adminOrders.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.get("/", async (req, res) => {
  try {
    const orders = await listAdminOrders({
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined,
    });
    res.json({ orders });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

adminOrdersRouter.get("/:id", async (req, res) => {
  try {
    const order = await getAdminOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order });
  } catch (error) {
    console.error(`GET /api/admin/orders/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load order" });
  }
});

adminOrdersRouter.patch("/:id", async (req, res) => {
  const statusRaw = req.body?.status;
  const status =
    typeof statusRaw === "string" ? parseOrderStatus(statusRaw) : undefined;

  if (typeof statusRaw === "string" && !status) {
    res.status(400).json({ error: "Invalid order status" });
    return;
  }

  try {
    const result = await updateAdminOrder(req.params.id, {
      status: status ?? undefined,
      courier: req.body?.courier,
      trackingNumber: req.body?.trackingNumber,
      expectedDelivery: req.body?.expectedDelivery,
      paymentStatus: req.body?.paymentStatus,
    });
    if (!result) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (result.shiprocketFailed) {
      res.status(422).json({
        error: result.shiprocketWarning ?? "Shiprocket fulfillment failed",
        order: result.order,
        shiprocketLog: result.shiprocketLog,
        shiprocketFailed: true,
      });
      return;
    }
    res.json(result);
  } catch (error) {
    console.error(`PATCH /api/admin/orders/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

adminOrdersRouter.post("/:id/status-events", async (req, res) => {
  const { status, label, note, eventAt } = req.body ?? {};
  if (!status || !label) {
    res.status(400).json({ error: "status and label are required" });
    return;
  }

  const parsedStatus = parseOrderStatus(String(status));
  if (!parsedStatus) {
    res.status(400).json({ error: "Invalid order status" });
    return;
  }

  try {
    const result = await addOrderStatusEvent(req.params.id, {
      status: parsedStatus,
      label: String(label),
      note: typeof note === "string" ? note : undefined,
      eventAt: typeof eventAt === "string" ? eventAt : undefined,
    });
    if (!result) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.status(201).json(result);
  } catch (error) {
    console.error(`POST /api/admin/orders/${req.params.id}/status-events failed:`, error);
    res.status(500).json({ error: "Failed to add status event" });
  }
});
