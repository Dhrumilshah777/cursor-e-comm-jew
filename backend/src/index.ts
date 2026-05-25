import "dotenv/config";

// Sentry must be initialized before any other module that we want
// instrumented (Express, Postgres, etc.).
import { initSentry, isSentryEnabled, Sentry } from "./lib/sentry.js";
initSentry();

import cors from "cors";

import cookieParser from "cookie-parser";

import express from "express";

import { prisma } from "./lib/prisma.js";
import { isQueueEnabled, shutdownQueues } from "./lib/queue.js";
import { connectRedis, isRedisConfigured, pingRedis } from "./lib/redis.js";
import { isResendConfigured } from "./lib/resendEmail.js";
import { createRateLimiter, ipKey } from "./middleware/rateLimit.js";
import { startNotificationsWorker } from "./workers/notificationsWorker.js";
import { startRefundsWorker } from "./workers/refundsWorker.js";
import { startShiprocketRetryWorker } from "./workers/shiprocketWorker.js";
import { startStockCleanupWorker } from "./workers/stockCleanupWorker.js";

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

// Render and most PaaS providers run the app behind a reverse proxy.
// Trusting the first proxy hop lets req.ip reflect the real client IP
// for rate limiting and logging.
app.set("trust proxy", 1);

const port = Number(process.env.PORT) || 4000;

const globalApiLimiter = createRateLimiter({
  name: "global-api",
  windowSeconds: 60,
  max: 300,
  keys: [ipKey("global-api")],
  message: "You're sending too many requests. Please slow down.",
  skip: (req) =>
    // Don't throttle webhooks (they have their own auth/signature checks).
    req.path.startsWith("/api/checkout/razorpay/webhook") ||
    req.path.startsWith("/api/shiprocket/webhook") ||
    req.path === "/api/health",
});

const publicReadLimiter = createRateLimiter({
  name: "public-read",
  windowSeconds: 60,
  max: 120,
  keys: [ipKey("public-read")],
  message: "Too many requests. Please slow down.",
});

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
    const redisConfigured = isRedisConfigured();
    const redisConnected = redisConfigured ? await pingRedis() : null;

    if (redisConfigured && !redisConnected) {
      res.status(503).json({
        ok: false,
        database: "connected",
        redis: "disconnected",
      });
      return;
    }

    res.json({
      ok: true,
      database: "connected",
      redis: redisConfigured ? "connected" : "not_configured",
      queues: isQueueEnabled() ? "running" : "inline",
      sentry: isSentryEnabled() ? "enabled" : "disabled",
      email: isResendConfigured() ? "enabled" : "disabled",
    });
  } catch {
    res.status(503).json({ ok: false, database: "disconnected" });
  }
});



app.use("/api", globalApiLimiter);

app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);

app.use("/api/products", publicReadLimiter, productsRouter);
app.use("/api/homepage", publicReadLimiter, homepageRouter);
app.use("/api/delivery", publicReadLimiter, deliveryRouter);

app.use("/api/returns", returnsRouter);

app.use("/api/admin", adminRouter);

// Sentry's Express error handler — must be registered AFTER all routes.
// Sets up captureException for any unhandled error thrown inside a handler.
Sentry.setupExpressErrorHandler(app);

// Final safety net so we always return JSON instead of leaking stack traces.
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Express] Unhandled error:", error);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  },
);

async function startServer() {
  try {
    await connectRedis();
  } catch (error) {
    console.error("[Redis] failed to connect on startup:", error);
    if (process.env.NODE_ENV === "production" && isRedisConfigured()) {
      process.exit(1);
    }
  }

  // Background workers — they only spin up when REDIS_URL is set; otherwise
  // jobs run inline as fallback (see queue.ts / refundQueue.ts).
  startNotificationsWorker();
  startRefundsWorker();
  startShiprocketRetryWorker();
  startStockCleanupWorker();

  const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[${signal}] graceful shutdown starting…`);
    server.close(() => console.log("[Server] HTTP server closed"));
    await shutdownQueues().catch((error) =>
      console.error("[Queue] shutdown error:", error),
    );
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };

  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
}

void startServer();


