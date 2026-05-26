import { Router } from "express";
import {
  getGoldRateSettings,
  updateGoldRate24kt,
} from "../../services/goldRates.js";

export const adminGoldRatesRouter = Router();

adminGoldRatesRouter.get("/", async (_req, res) => {
  try {
    const rates = await getGoldRateSettings();
    res.json({ rates });
  } catch (error) {
    console.error("GET /api/admin/gold-rates failed:", error);
    res.status(500).json({ error: "Failed to load gold rates" });
  }
});

adminGoldRatesRouter.put("/", async (req, res) => {
  const raw = req.body?.rate24ktPerGram;
  const rate24ktPerGram =
    typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));

  if (!Number.isFinite(rate24ktPerGram) || rate24ktPerGram <= 0) {
    res.status(400).json({ error: "Enter a valid 24KT rate per gram (₹)" });
    return;
  }

  try {
    const result = await updateGoldRate24kt(rate24ktPerGram);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_RATE") {
      res.status(400).json({ error: "Enter a valid 24KT rate per gram (₹)" });
      return;
    }
    console.error("PUT /api/admin/gold-rates failed:", error);
    res.status(500).json({ error: "Failed to update gold rates" });
  }
});
