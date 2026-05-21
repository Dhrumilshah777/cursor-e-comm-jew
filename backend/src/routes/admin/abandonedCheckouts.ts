import { Router } from "express";
import { listAdminAbandonedCheckouts } from "../../services/adminAbandonedCheckouts.js";

export const adminAbandonedCheckoutsRouter = Router();

adminAbandonedCheckoutsRouter.get("/", async (_req, res) => {
  try {
    const sessions = await listAdminAbandonedCheckouts();
    res.json({ sessions });
  } catch (error) {
    console.error("GET /api/admin/abandoned-checkouts failed:", error);
    res.status(500).json({ error: "Failed to load abandoned checkouts" });
  }
});
