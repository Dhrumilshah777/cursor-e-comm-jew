import { Router } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import {
  createAdminCoupon,
  deactivateAdminCoupon,
  getAdminCouponById,
  listAdminCoupons,
  updateAdminCoupon,
} from "../../services/adminCoupons.js";

export const adminCouponsRouter = Router();

adminCouponsRouter.get("/", async (_req, res) => {
  try {
    const coupons = await listAdminCoupons();
    res.json({ coupons });
  } catch (error) {
    console.error("GET /api/admin/coupons failed:", error);
    res.status(500).json({ error: "Failed to load coupons" });
  }
});

adminCouponsRouter.get("/:id", async (req, res) => {
  try {
    const coupon = await getAdminCouponById(req.params.id);
    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }
    res.json({ coupon });
  } catch (error) {
    console.error(`GET /api/admin/coupons/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load coupon" });
  }
});

adminCouponsRouter.post("/", async (req, res) => {
  const { code, type, value } = req.body ?? {};
  if (!code || !type || value == null) {
    res.status(400).json({ error: "Code, type, and value are required" });
    return;
  }

  try {
    const coupon = await createAdminCoupon(req.body);
    res.status(201).json({ coupon });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Coupon code already exists" });
      return;
    }
    console.error("POST /api/admin/coupons failed:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to create coupon",
    });
  }
});

adminCouponsRouter.patch("/:id", async (req, res) => {
  try {
    const coupon = await updateAdminCoupon(req.params.id, req.body);
    if (!coupon) {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }
    res.json({ coupon });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Coupon code already exists" });
      return;
    }
    console.error(`PATCH /api/admin/coupons/${req.params.id} failed:`, error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to update coupon",
    });
  }
});

adminCouponsRouter.delete("/:id", async (req, res) => {
  try {
    const coupon = await deactivateAdminCoupon(req.params.id);
    res.json({ coupon });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Coupon not found" });
      return;
    }
    console.error(`DELETE /api/admin/coupons/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to deactivate coupon" });
  }
});
