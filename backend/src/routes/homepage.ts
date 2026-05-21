import { Router } from "express";
import { getPublicHomepage } from "../services/homepageFeatures.js";

export const homepageRouter = Router();

homepageRouter.get("/", async (_req, res) => {
  try {
    const homepage = await getPublicHomepage();
    res.json(homepage);
  } catch (error) {
    console.error("GET /api/homepage failed:", error);
    res.status(500).json({ error: "Failed to load homepage" });
  }
});
