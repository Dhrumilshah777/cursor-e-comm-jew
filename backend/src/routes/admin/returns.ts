import { Router } from "express";
import { returnStatusToDb } from "../../lib/returnStatus.js";
import {
  appendAdminNotes,
  approveReturnRequest,
  getAdminReturnById,
  listAdminReturns,
  updateReturnStatus,
} from "../../services/returns.js";

export const adminReturnsRouter = Router();

adminReturnsRouter.get("/", async (req, res) => {
  try {
    const returns = await listAdminReturns({
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      orderNumber:
        typeof req.query.orderNumber === "string" ? req.query.orderNumber : undefined,
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined,
    });
    res.json({ returns });
  } catch (error) {
    console.error("GET /api/admin/returns failed:", error);
    res.status(500).json({ error: "Failed to load returns" });
  }
});

adminReturnsRouter.get("/:id", async (req, res) => {
  try {
    const returnRequest = await getAdminReturnById(req.params.id);
    if (!returnRequest) {
      res.status(404).json({ error: "Return request not found" });
      return;
    }
    res.json({ return: returnRequest });
  } catch (error) {
    console.error(`GET /api/admin/returns/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load return" });
  }
});

adminReturnsRouter.patch("/:id", async (req, res) => {
  const status = returnStatusToDb(String(req.body?.status ?? ""));
  if (!status) {
    res.status(400).json({ error: "Valid status is required" });
    return;
  }

  try {
    if (status === "APPROVED") {
      const result = await approveReturnRequest(req.params.id);
      if ("error" in result) {
        if (result.error === "NOT_FOUND") {
          res.status(404).json({ error: "Return request not found" });
          return;
        }
        res.status(422).json({
          error: result.message ?? "Return approval failed",
          log: result.log,
        });
        return;
      }
      res.json({ return: result.returnRequest, log: result.log });
      return;
    }

    const updated = await updateReturnStatus(req.params.id, status, {
      note: typeof req.body?.note === "string" ? req.body.note : undefined,
    });
    res.json({ return: updated });
  } catch (error) {
    console.error(`PATCH /api/admin/returns/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to update return" });
  }
});

adminReturnsRouter.patch("/:id/pickup", async (req, res) => {
  const pickupScheduledFor = req.body?.pickupScheduledFor;
  if (!pickupScheduledFor || typeof pickupScheduledFor !== "string") {
    res.status(400).json({ error: "pickupScheduledFor is required" });
    return;
  }

  try {
    const updated = await updateReturnStatus(req.params.id, "PICKUP_SCHEDULED", {
      pickupScheduledFor,
      note: "Pickup scheduled by admin",
    });
    res.json({ return: updated });
  } catch (error) {
    console.error(`PATCH /api/admin/returns/${req.params.id}/pickup failed:`, error);
    res.status(500).json({ error: "Failed to schedule pickup" });
  }
});

adminReturnsRouter.patch("/:id/status", async (req, res) => {
  const status = returnStatusToDb(String(req.body?.status ?? ""));
  if (!status) {
    res.status(400).json({ error: "Valid status is required" });
    return;
  }

  try {
    const result = await updateReturnStatus(req.params.id, status, {
      pickupScheduledFor:
        typeof req.body?.pickupScheduledFor === "string"
          ? req.body.pickupScheduledFor
          : undefined,
      note: typeof req.body?.note === "string" ? req.body.note : undefined,
    });

    if ("error" in result && result.error) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ error: "Return request not found" });
        return;
      }
      res.status(422).json({
        error: result.message ?? "Failed to update return",
        log: result.log,
      });
      return;
    }

    if ("returnRequest" in result) {
      res.json({ return: result.returnRequest, log: result.log });
      return;
    }

    res.json({ return: result });
  } catch (error) {
    console.error(`PATCH /api/admin/returns/${req.params.id}/status failed:`, error);
    res.status(500).json({ error: "Failed to update return status" });
  }
});

adminReturnsRouter.post("/:id/notes", async (req, res) => {
  const adminNotes = req.body?.adminNotes;
  if (!adminNotes || typeof adminNotes !== "string") {
    res.status(400).json({ error: "adminNotes is required" });
    return;
  }

  try {
    const updated = await appendAdminNotes(req.params.id, adminNotes);
    res.json({ return: updated });
  } catch (error) {
    console.error(`POST /api/admin/returns/${req.params.id}/notes failed:`, error);
    res.status(500).json({ error: "Failed to save admin notes" });
  }
});
