import { Router } from "express";
import type { HomepageSection } from "../../generated/prisma/client.js";
import {
  createHomepageFeature,
  deleteHomepageFeature,
  listAdminHomepageFeatures,
  reorderHomepageFeatures,
  updateHomepageFeature,
} from "../../services/homepageFeatures.js";

export const adminHomepageRouter = Router();

function parseSection(value: unknown): HomepageSection | null {
  if (value === "NEW_ARRIVALS" || value === "TOP_STYLES" || value === "ELEGANCE_IN_MOTION") {
    return value;
  }
  return null;
}

adminHomepageRouter.get("/", async (req, res) => {
  try {
    const section = parseSection(req.query.section);
    const features = await listAdminHomepageFeatures(section ?? undefined);
    res.json({ features });
  } catch (error) {
    console.error("GET /api/admin/homepage failed:", error);
    res.status(500).json({ error: "Failed to load homepage features" });
  }
});

adminHomepageRouter.post("/", async (req, res) => {
  const section = parseSection(req.body?.section);
  if (!section) {
    res.status(400).json({ error: "Valid section is required" });
    return;
  }

  try {
    const result = await createHomepageFeature({
      section,
      productId: req.body?.productId,
      videoUrl: req.body?.videoUrl,
      posterUrl: req.body?.posterUrl,
      caption: req.body?.caption,
      linkUrl: req.body?.linkUrl,
    });

    if ("error" in result) {
      const messages: Record<string, string> = {
        ELEGANCE_LIMIT: "Maximum 4 videos allowed in Elegance in Motion",
        VIDEO_REQUIRED: "Video URL is required",
        PRODUCT_REQUIRED: "Product is required for this section",
        PRODUCT_NOT_FOUND: "Product not found",
        DUPLICATE_PRODUCT: "Product is already in this section",
      };
      res.status(400).json({
        error: messages[result.error ?? ""] ?? "Could not add item",
      });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/admin/homepage failed:", error);
    res.status(500).json({ error: "Failed to add homepage item" });
  }
});

adminHomepageRouter.patch("/:id", async (req, res) => {
  try {
    const feature = await updateHomepageFeature(req.params.id, req.body ?? {});
    if (!feature) {
      res.status(404).json({ error: "Homepage item not found" });
      return;
    }
    res.json({ feature });
  } catch (error) {
    console.error(`PATCH /api/admin/homepage/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to update homepage item" });
  }
});

adminHomepageRouter.delete("/:id", async (req, res) => {
  try {
    const result = await deleteHomepageFeature(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Homepage item not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/admin/homepage/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to remove homepage item" });
  }
});

adminHomepageRouter.post("/reorder", async (req, res) => {
  const section = parseSection(req.body?.section);
  const orderedIds = req.body?.orderedIds;
  if (!section || !Array.isArray(orderedIds)) {
    res.status(400).json({ error: "section and orderedIds are required" });
    return;
  }

  try {
    const features = await reorderHomepageFeatures(
      section,
      orderedIds.map(String),
    );
    res.json({ features });
  } catch (error) {
    console.error("POST /api/admin/homepage/reorder failed:", error);
    res.status(500).json({ error: "Failed to reorder items" });
  }
});
