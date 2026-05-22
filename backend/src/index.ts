import "dotenv/config";

import cors from "cors";

import cookieParser from "cookie-parser";

import express from "express";

import { prisma } from "./lib/prisma.js";

import { adminRouter } from "./routes/admin/index.js";
import { authRouter } from "./routes/auth.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { handleRazorpayWebhook } from "./services/razorpayCheckout.js";
import { ordersRouter } from "./routes/orders.js";
import { shiprocketWebhookRouter } from "./routes/shiprocketWebhook.js";

import { productsRouter } from "./routes/products.js";
import { homepageRouter } from "./routes/homepage.js";

import { returnsRouter } from "./routes/returns.js";
import { deliveryRouter } from "./routes/delivery.js";



const app = express();

const port = Number(process.env.PORT) || 4000;

const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(cookieParser());

app.post(
  "/api/checkout/razorpay/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature || typeof signature !== "string") {
      res.status(400).json({ error: "Missing webhook signature" });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

    try {
      const result = await handleRazorpayWebhook(rawBody, signature);
      if ("error" in result) {
        res.status(400).json({ error: "Invalid webhook" });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("POST /api/checkout/razorpay/webhook failed:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/shiprocket/webhook", shiprocketWebhookRouter);



app.get("/api/health", async (_req, res) => {

  try {

    await prisma.$queryRaw`SELECT 1`;

    res.json({ ok: true, database: "connected" });

  } catch {

    res.status(503).json({ ok: false, database: "disconnected" });

  }

});



app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);

app.use("/api/products", productsRouter);
app.use("/api/homepage", homepageRouter);

app.use("/api/returns", returnsRouter);
app.use("/api/delivery", deliveryRouter);

app.use("/api/admin", adminRouter);



app.listen(port, () => {

  console.log(`API listening on http://localhost:${port}`);

});


