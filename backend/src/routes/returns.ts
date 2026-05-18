import { Router } from "express";
import {
  requireCustomer,
  type CustomerRequest,
} from "../middleware/requireCustomer.js";
import { getReturnForOrder, submitReturnRequest } from "../services/returns.js";

export const returnsRouter = Router();

returnsRouter.use(requireCustomer);

returnsRouter.post("/", async (req: CustomerRequest, res) => {
  const userId = req.customer!.userId;
  const {
    orderId,
    orderItemId,
    reason,
    customerNotes,
    policyConfirmed,
    pickupAddressId,
    pickupAddress,
    productImageUrls,
    packagingImageUrls,
  } = req.body ?? {};

  if (!orderId || !orderItemId || !reason) {
    res.status(400).json({
      error: "orderId, orderItemId, and reason are required",
    });
    return;
  }

  if (!pickupAddressId && !pickupAddress) {
    res.status(400).json({
      error: "pickupAddressId or pickupAddress is required",
    });
    return;
  }

  try {
    const result = await submitReturnRequest({
      userId,
      orderId: String(orderId),
      orderItemId: String(orderItemId),
      reason: String(reason),
      customerNotes:
        typeof customerNotes === "string" ? customerNotes : undefined,
      policyConfirmed: Boolean(policyConfirmed),
      productImageUrls: Array.isArray(productImageUrls)
        ? productImageUrls.map(String)
        : undefined,
      packagingImageUrls: Array.isArray(packagingImageUrls)
        ? packagingImageUrls.map(String)
        : undefined,
      ...(pickupAddressId
        ? { pickupAddressId: String(pickupAddressId) }
        : { pickupAddress }),
    });

    if ("error" in result && result.error) {
      const status =
        result.error === "RETURN_ALREADY_EXISTS"
          ? 409
          : result.error === "USER_NOT_FOUND"
            ? 404
            : 400;
      res.status(status).json({ error: result.error });
      return;
    }

    if (!("returnRequest" in result) || !result.returnRequest) {
      res.status(500).json({ error: "Failed to submit return request" });
      return;
    }

    res.status(201).json({ return: result.returnRequest });
  } catch (error) {
    console.error("POST /api/returns failed:", error);
    res.status(500).json({ error: "Failed to submit return request" });
  }
});

returnsRouter.get("/order/:orderId", async (req: CustomerRequest, res) => {
  try {
    const orderId = String(req.params.orderId);
    const returnRequest = await getReturnForOrder(req.customer!.userId, orderId);
    if (!returnRequest) {
      res.status(404).json({ error: "Return request not found" });
      return;
    }
    res.json({ return: returnRequest });
  } catch (error) {
    console.error(`GET /api/returns/order/${req.params.orderId} failed:`, error);
    res.status(500).json({ error: "Failed to load return request" });
  }
});
