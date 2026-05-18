import { Router } from "express";
import { getAdminDashboard } from "../../services/adminDashboard.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.get("/", async (_req, res) => {
  try {
    const dashboard = await getAdminDashboard();
    res.json({ dashboard });
  } catch (error) {
    console.error("GET /api/admin/dashboard failed:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});
