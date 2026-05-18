import { Router } from "express";
import {
  handleShiprocketWebhook,
  verifyShiprocketWebhookToken,
  type ShiprocketWebhookPayload,
} from "../services/shiprocketWebhook.js";

export const shiprocketWebhookRouter = Router();

function extractToken(req: {
  headers: Record<string, string | string[] | undefined>;
}): string | undefined {
  const apiKey = req.headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.trim()) return apiKey.trim();

  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return undefined;
}

shiprocketWebhookRouter.post("/", async (req, res) => {
  const token = extractToken(req);

  if (!verifyShiprocketWebhookToken(token)) {
    res.status(401).json({ error: "Invalid webhook token" });
    return;
  }

  const payload = (req.body ?? {}) as ShiprocketWebhookPayload;

  try {
    const result = await handleShiprocketWebhook(payload);

    if ("error" in result && result.error === "WEBHOOK_NOT_CONFIGURED") {
      res.status(501).json({ error: "Shiprocket webhook secret not configured" });
      return;
    }

    res.json(result);
  } catch (error) {
    console.error("POST /api/shiprocket/webhook failed:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
