import { Router } from "express";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import {
  addWishlistItem,
  getWishlistForUser,
  removeWishlistItem,
  toggleWishlistItem,
} from "../services/wishlist.js";

export const wishlistRouter = Router();

wishlistRouter.use(requireCustomer);

wishlistRouter.get("/", async (req: CustomerRequest, res) => {
  try {
    const wishlist = await getWishlistForUser(req.customer!.userId);
    res.json({ wishlist });
  } catch (error) {
    console.error("GET /api/wishlist failed:", error);
    res.status(500).json({ error: "Failed to load wishlist" });
  }
});

wishlistRouter.post("/items", async (req: CustomerRequest, res) => {
  const productId = req.body?.productId;
  if (!productId || typeof productId !== "string") {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  try {
    const result = await addWishlistItem(req.customer!.userId, productId.trim());
    if ("error" in result) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.status(201).json({ wishlist: result });
  } catch (error) {
    console.error("POST /api/wishlist/items failed:", error);
    res.status(500).json({ error: "Failed to save item" });
  }
});

wishlistRouter.post("/toggle", async (req: CustomerRequest, res) => {
  const productId = req.body?.productId;
  if (!productId || typeof productId !== "string") {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  try {
    const result = await toggleWishlistItem(req.customer!.userId, productId.trim());
    if ("error" in result) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ wishlist: result });
  } catch (error) {
    console.error("POST /api/wishlist/toggle failed:", error);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

wishlistRouter.delete("/items/:productId", async (req: CustomerRequest, res) => {
  const rawId = req.params.productId;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!productId) {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  try {
    const result = await removeWishlistItem(req.customer!.userId, productId);
    if ("error" in result) {
      res.status(404).json({ error: "Wishlist item not found" });
      return;
    }
    res.json({ wishlist: result });
  } catch (error) {
    console.error("DELETE /api/wishlist/items/:productId failed:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});
