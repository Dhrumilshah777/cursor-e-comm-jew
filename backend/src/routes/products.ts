import { Router } from "express";
import {
  getProductBySlug,
  getProducts,
  getRelatedProducts,
} from "../services/products.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : undefined;
  const search =
    typeof req.query.q === "string"
      ? req.query.q.trim()
      : typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

  try {
    const products = await getProducts({ category, search });
    res.json({ products });
  } catch (error) {
    console.error("GET /api/products failed:", error);
    res.status(500).json({ error: "Failed to load products" });
  }
});

productsRouter.get("/:slug/related", async (req, res) => {
  const slug = req.params.slug;
  const limit =
    typeof req.query.limit === "string"
      ? Number.parseInt(req.query.limit, 10)
      : 4;

  try {
    const products = await getRelatedProducts(slug, Number.isFinite(limit) ? limit : 4);
    res.json({ products });
  } catch (error) {
    console.error(`GET /api/products/${slug}/related failed:`, error);
    res.status(500).json({ error: "Failed to load related products" });
  }
});

productsRouter.get("/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (error) {
    console.error(`GET /api/products/${slug} failed:`, error);
    res.status(500).json({ error: "Failed to load product" });
  }
});
