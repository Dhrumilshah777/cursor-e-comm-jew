import { Router } from "express";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import { createRateLimiter, ipKey, userKey } from "../middleware/rateLimit.js";
import {
  deleteSavedAddressForUser,
  listSavedAddressesForUser,
  updateSavedAddressForUser,
} from "../services/addresses.js";
import { parseCheckoutAddressPayload } from "../services/checkoutAddresses.js";
import { previewCheckoutCoupon, listAvailableCheckoutCoupons } from "../services/checkout.js";
import {
  createRazorpayCheckout,
  verifyRazorpayCheckoutAndPlaceOrder,
} from "../services/razorpayCheckout.js";

export const checkoutRouter = Router();

const couponApplyLimiter = createRateLimiter({
  name: "checkout-coupon",
  windowSeconds: 10 * 60,
  max: 20,
  keys: [userKey("coupon"), ipKey("coupon")],
  message: "Too many coupon attempts. Please wait a few minutes.",
});

const createCheckoutLimiter = createRateLimiter({
  name: "checkout-create-order",
  windowSeconds: 10 * 60,
  max: 30,
  keys: [userKey("checkout-create"), ipKey("checkout-create")],
  message: "Too many checkout attempts. Please wait before trying again.",
});

const verifyPaymentLimiter = createRateLimiter({
  name: "checkout-verify",
  windowSeconds: 10 * 60,
  max: 60,
  keys: [userKey("checkout-verify"), ipKey("checkout-verify")],
  message: "Too many payment verifications. Please wait before retrying.",
});

function couponErrorResponse(
  res: import("express").Response,
  result: { error: string; message?: string },
) {
  if (result.error === "CART_EMPTY") {
    res.status(400).json({ error: "Your bag is empty" });
    return true;
  }
  if (result.error === "PRODUCT_UNAVAILABLE") {
    res.status(400).json({ error: "A product in your bag is no longer available" });
    return true;
  }
  if ("message" in result && result.message) {
    res.status(400).json({ error: result.message });
    return true;
  }
  res.status(400).json({ error: "Invalid coupon code" });
  return true;
}

checkoutRouter.get("/coupons", requireCustomer, async (req: CustomerRequest, res) => {
  try {
    const result = await listAvailableCheckoutCoupons(req.customer!.userId);
    if ("error" in result) {
      if (result.error === "CART_EMPTY") {
        res.status(400).json({ error: "Your bag is empty" });
        return;
      }
      res.status(400).json({ error: "A product in your bag is no longer available" });
      return;
    }

    res.json({ coupons: result.coupons });
  } catch (error) {
    console.error("GET /api/checkout/coupons failed:", error);
    res.status(500).json({ error: "Failed to load coupons" });
  }
});

checkoutRouter.post("/apply-coupon", requireCustomer, couponApplyLimiter, async (req: CustomerRequest, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!code) {
    res.status(400).json({ error: "Coupon code is required" });
    return;
  }

  try {
    const result = await previewCheckoutCoupon(req.customer!.userId, code);
    if ("error" in result && result.error) {
      couponErrorResponse(res, result);
      return;
    }

    res.json({
      subtotalPaise: result.subtotalPaise,
      shippingPaise: result.shippingPaise,
      discountPaise: result.discountPaise,
      totalPaise: result.totalPaise,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error("POST /api/checkout/apply-coupon failed:", error);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

checkoutRouter.get("/addresses", requireCustomer, async (req: CustomerRequest, res) => {
  try {
    const addresses = await listSavedAddressesForUser(req.customer!.userId);
    res.json({ addresses });
  } catch (error) {
    console.error("GET /api/checkout/addresses failed:", error);
    res.status(500).json({ error: "Failed to load addresses" });
  }
});

checkoutRouter.patch("/addresses/:id", requireCustomer, async (req: CustomerRequest, res) => {
  const addressId = String(req.params.id);
  const body = req.body ?? {};

  const input = {
    name: typeof body.name === "string" ? body.name : "",
    line1: typeof body.line1 === "string" ? body.line1 : "",
    line2: typeof body.line2 === "string" ? body.line2 : undefined,
    city: typeof body.city === "string" ? body.city : "",
    state: typeof body.state === "string" ? body.state : "",
    pincode: typeof body.pincode === "string" ? body.pincode : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    label: typeof body.label === "string" ? body.label : undefined,
  };

  try {
    const result = await updateSavedAddressForUser(
      req.customer!.userId,
      addressId,
      input,
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ error: "Address not found" });
        return;
      }
      res.status(400).json({
        error: "message" in result ? result.message : "Invalid address",
      });
      return;
    }

    res.json({ address: result.address });
  } catch (error) {
    console.error("PATCH /api/checkout/addresses/:id failed:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});

checkoutRouter.delete("/addresses/:id", requireCustomer, async (req: CustomerRequest, res) => {
  try {
    const result = await deleteSavedAddressForUser(
      req.customer!.userId,
      String(req.params.id),
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ error: "Address not found" });
        return;
      }
      if (result.error === "IN_USE") {
        res.status(409).json({ error: result.message });
        return;
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/checkout/addresses/:id failed:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});

checkoutRouter.post("/razorpay/create-order", requireCustomer, createCheckoutLimiter, async (req: CustomerRequest, res) => {
  const payload = parseCheckoutAddressPayload(req.body);
  const email = typeof req.body?.email === "string" ? req.body.email : "";

  if (!payload) {
    res.status(400).json({ error: "Delivery address or addressId is required" });
    return;
  }

  if (!email.trim()) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    const couponCode =
      typeof req.body?.couponCode === "string" ? req.body.couponCode.trim() : undefined;
    const result = await createRazorpayCheckout(
      req.customer!.userId,
      payload,
      email,
      couponCode || undefined,
    );

    if ("error" in result) {
      if (result.error === "CART_EMPTY") {
        res.status(400).json({ error: "Your bag is empty" });
        return;
      }
      if (result.error === "PRODUCT_UNAVAILABLE") {
        res.status(400).json({ error: "A product in your bag is no longer available" });
        return;
      }
      if (result.error === "ADDRESS_NOT_FOUND") {
        res.status(400).json({ error: "Saved address not found" });
        return;
      }
      if (result.error === "INVALID_ADDRESS") {
        res.status(400).json({
          error: "message" in result ? result.message : "Invalid address",
        });
        return;
      }
      if (result.error === "INVALID_EMAIL") {
        res.status(400).json({
          error: "message" in result ? result.message : "Valid email is required",
        });
        return;
      }
      if (result.error === "OUT_OF_STOCK") {
        const unavailable = "unavailable" in result ? result.unavailable : [];
        const names = unavailable
          .map((item) => item.name)
          .filter((name): name is string => Boolean(name));
        const message = names.length > 0
          ? `${names.join(", ")} just sold out. Please remove it from your bag and try again.`
          : "One or more items in your bag are sold out. Please refresh and try again.";
        res.status(409).json({ error: message, unavailable });
        return;
      }
      if ("message" in result && result.message) {
        res.status(400).json({ error: result.message });
        return;
      }
    }

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RAZORPAY_NOT_CONFIGURED") {
      res.status(503).json({ error: "Payment service is not configured" });
      return;
    }
    console.error("POST /api/checkout/razorpay/create-order failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to start payment",
    });
  }
});

checkoutRouter.post("/razorpay/verify", requireCustomer, verifyPaymentLimiter, async (req: CustomerRequest, res) => {
  const razorpayOrderId = req.body?.razorpay_order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id;
  const razorpaySignature = req.body?.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ error: "Payment verification data is required" });
    return;
  }

  try {
    const result = await verifyRazorpayCheckoutAndPlaceOrder(req.customer!.userId, {
      razorpayOrderId: String(razorpayOrderId),
      razorpayPaymentId: String(razorpayPaymentId),
      razorpaySignature: String(razorpaySignature),
    });

    if ("error" in result && result.error) {
      const messages: Record<string, string> = {
        PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
        CHECKOUT_SESSION_NOT_FOUND: "Checkout session not found",
        CHECKOUT_SESSION_EXPIRED: "Checkout session expired. Please try again.",
        PAYMENT_AMOUNT_MISMATCH: "Payment amount mismatch",
        CART_EMPTY: "Your bag is empty",
        PRODUCT_UNAVAILABLE: "A product is no longer available",
      };
      res.status(400).json({
        error: messages[result.error] ?? "Could not complete order",
      });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/checkout/razorpay/verify failed:", error);
    res.status(500).json({ error: "Failed to complete order" });
  }
});
