import { Router } from "express";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import type { CheckoutAddressInput } from "../services/checkout.js";
import {
  createRazorpayCheckout,
  verifyRazorpayCheckoutAndPlaceOrder,
} from "../services/razorpayCheckout.js";

export const checkoutRouter = Router();

checkoutRouter.post("/razorpay/create-order", requireCustomer, async (req: CustomerRequest, res) => {
  const address =
    req.body?.address && typeof req.body.address === "object"
      ? (req.body.address as CheckoutAddressInput)
      : undefined;

  if (!address) {
    res.status(400).json({ error: "Delivery address is required" });
    return;
  }

  try {
    const result = await createRazorpayCheckout(req.customer!.userId, address);

    if ("error" in result) {
      if (result.error === "CART_EMPTY") {
        res.status(400).json({ error: "Your bag is empty" });
        return;
      }
      if (result.error === "PRODUCT_UNAVAILABLE") {
        res.status(400).json({ error: "A product in your bag is no longer available" });
        return;
      }
      if (result.error === "INVALID_ADDRESS") {
        res.status(400).json({
          error: "message" in result ? result.message : "Invalid address",
        });
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

checkoutRouter.post("/razorpay/verify", requireCustomer, async (req: CustomerRequest, res) => {
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

    if ("error" in result) {
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
