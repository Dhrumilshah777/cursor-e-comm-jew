import { Router } from "express";
import { getGoldRatePublicSnapshot } from "../services/goldRates.js";

export const goldRatesRouter = Router();

goldRatesRouter.get("/", async (_req, res) => {
  try {
    const snapshot = await getGoldRatePublicSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error("GET /api/gold-rates failed:", error);
    res.status(500).json({ error: "Failed to load gold rates" });
  }
});
