import { Router } from "express";
import { estimateDeliveryToPincode } from "../services/deliveryEstimate.js";

export const deliveryRouter = Router();

deliveryRouter.get("/estimate", async (req, res) => {
  const pincode =
    typeof req.query.pincode === "string" ? req.query.pincode : "";
  const weightRaw =
    typeof req.query.weightKg === "string" ? req.query.weightKg : "0.1";
  const weightKg = Number.parseFloat(weightRaw);

  try {
    const result = await estimateDeliveryToPincode(
      pincode,
      Number.isFinite(weightKg) ? weightKg : 0.1,
    );

    if ("error" in result) {
      const status =
        result.error === "INVALID_PINCODE"
          ? 400
          : result.error === "SHIPROCKET_NOT_CONFIGURED" ||
              result.error === "PICKUP_PINCODE_MISSING"
            ? 503
            : 400;
      res.status(status).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("GET /api/delivery/estimate failed:", error);
    res.status(500).json({
      error: "DELIVERY_CHECK_FAILED",
      message: "Could not check delivery for this PIN code. Please try again.",
    });
  }
});
