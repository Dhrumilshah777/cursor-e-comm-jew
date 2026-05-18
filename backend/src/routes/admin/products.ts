import { Router } from "express";
import type { GoldPurity, MakingChargeKind, MetalType } from "../../generated/prisma/client.js";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  listAdminProducts,
  updateAdminProduct,
} from "../../services/adminProducts.js";

export const adminProductsRouter = Router();

adminProductsRouter.get("/", async (req, res) => {
  try {
    const products = await listAdminProducts({
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      includeInactive: req.query.includeInactive !== "false",
    });
    res.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    res.status(500).json({ error: "Failed to load products" });
  }
});

adminProductsRouter.get("/:id", async (req, res) => {
  try {
    const product = await getAdminProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (error) {
    console.error(`GET /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load product" });
  }
});

adminProductsRouter.post("/", async (req, res) => {
  try {
    const product = await createAdminProduct({
      id: req.body?.id,
      slug: req.body.slug,
      name: req.body.name,
      category: req.body.category,
      image: req.body.image,
      alt: req.body.alt,
      pricePaise: Number(req.body.pricePaise),
      metal: req.body.metal as MetalType,
      purity: req.body.purity as GoldPurity,
      weightGrams: String(req.body.weightGrams),
      sku: req.body.sku,
      ringSize: req.body.ringSize,
      description: req.body.description,
      gallery: req.body.gallery,
      makingChargeKind: req.body.makingChargeKind as MakingChargeKind,
      makingChargeValue: req.body.makingChargeValue,
      gstPercent: req.body.gstPercent,
      isActive: req.body.isActive,
    });
    res.status(201).json({ product });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

adminProductsRouter.patch("/:id", async (req, res) => {
  try {
    const product = await updateAdminProduct(req.params.id, req.body);
    res.json({ product });
  } catch (error) {
    console.error(`PATCH /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

adminProductsRouter.delete("/:id", async (req, res) => {
  try {
    const product = await deleteAdminProduct(req.params.id);
    res.json({ product });
  } catch (error) {
    console.error(`DELETE /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to deactivate product" });
  }
});
