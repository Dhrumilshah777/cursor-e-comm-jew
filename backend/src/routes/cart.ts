import { Router } from "express";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import {
  addCartItem,
  getCartForUser,
  removeCartItem,
} from "../services/cart.js";

export const cartRouter = Router();

cartRouter.use(requireCustomer);

cartRouter.get("/", async (req: CustomerRequest, res) => {
  try {
    const cart = await getCartForUser(req.customer!.userId);
    res.json({ cart });
  } catch (error) {
    console.error("GET /api/cart failed:", error);
    res.status(500).json({ error: "Failed to load cart" });
  }
});

cartRouter.post("/items", async (req: CustomerRequest, res) => {
  const productId = req.body?.productId;
  if (!productId || typeof productId !== "string") {
    res.status(400).json({ error: "productId is required" });
    return;
  }

  const size = typeof req.body?.size === "string" ? req.body.size : undefined;

  try {
    const result = await addCartItem(req.customer!.userId, productId, size);

    if ("error" in result) {
      if (result.error === "PRODUCT_NOT_FOUND") {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      if (result.error === "ALREADY_IN_CART") {
        res.status(409).json({ error: "This item is already in your bag" });
        return;
      }
      if (result.error === "OUT_OF_STOCK") {
        res.status(409).json({ error: "This item is currently sold out." });
        return;
      }
      res.status(400).json({ error: "Could not add item to cart" });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/cart/items failed:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

cartRouter.delete("/items/:id", async (req: CustomerRequest, res) => {
  const rawId = req.params.id;
  const itemId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!itemId) {
    res.status(400).json({ error: "Item id is required" });
    return;
  }

  try {
    const result = await removeCartItem(req.customer!.userId, itemId);

    if ("error" in result) {
      res.status(404).json({ error: "Cart item not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/cart/items/:id failed:", error);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});
