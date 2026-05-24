import { Router } from "express";
import {
  customerCookieClearOptions,
  customerCookieName,
  customerCookieOptions,
} from "../lib/customerAuth.js";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import { OtpRateLimitError, TwilioVerifyError } from "../lib/twilioVerify.js";
import {
  createRateLimiter,
  ipKey,
  phoneFromBodyKey,
} from "../middleware/rateLimit.js";
import {
  getCustomerProfile,
  sendLoginOtp,
  verifyLoginOtp,
} from "../services/customerAuth.js";

export const authRouter = Router();

const sendOtpLimiter = createRateLimiter({
  name: "auth-send-otp",
  windowSeconds: 15 * 60,
  max: 5,
  keys: [phoneFromBodyKey("send-otp"), ipKey("send-otp")],
  message:
    "Too many OTP requests. Please wait a few minutes before trying again.",
});

const sendOtpDailyLimiter = createRateLimiter({
  name: "auth-send-otp-daily",
  windowSeconds: 24 * 60 * 60,
  max: 15,
  keys: [phoneFromBodyKey("send-otp-daily")],
  message:
    "You've requested too many OTPs today. Please try again tomorrow or contact support.",
});

const verifyOtpLimiter = createRateLimiter({
  name: "auth-verify-otp",
  windowSeconds: 15 * 60,
  max: 10,
  keys: [phoneFromBodyKey("verify-otp"), ipKey("verify-otp")],
  message: "Too many incorrect attempts. Please request a new code.",
});

authRouter.post("/send-otp", sendOtpDailyLimiter, sendOtpLimiter, async (req, res) => {
  const phone = req.body?.phone;
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  const resend = req.body?.resend === true;

  try {
    const result = await sendLoginOtp(phone, { resend });
    res.json(result);
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      res.status(429).json({
        error: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      });
      return;
    }
    if (error instanceof Error && error.message === "INVALID_PHONE") {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }
    if (error instanceof Error && error.message === "TWILIO_NOT_CONFIGURED") {
      res.status(503).json({
        error: "SMS service not configured. Add Twilio keys or set OTP_DEV_MODE=true.",
      });
      return;
    }
    if (error instanceof TwilioVerifyError) {
      const message =
        error.twilioCode === 60203
          ? "Too many OTP requests. Please wait a few minutes and try again."
          : error.message;
      res.status(400).json({ error: message });
      return;
    }
    console.error("POST /api/auth/send-otp failed:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

authRouter.post("/verify-otp", verifyOtpLimiter, async (req, res) => {
  const phone = req.body?.phone;
  const otp = req.body?.otp;
  const verificationSid =
    typeof req.body?.verificationSid === "string" ? req.body.verificationSid : undefined;

  if (!phone || !otp) {
    res.status(400).json({ error: "phone and otp are required" });
    return;
  }

  try {
    const result = await verifyLoginOtp(phone, String(otp), verificationSid);

    if ("error" in result) {
      const message =
        result.error === "OTP_EXPIRED"
          ? "This code is no longer valid. Enter the latest code from SMS, or tap Resend code."
          : "Invalid OTP. Please try again.";
      res.status(400).json({ error: message, code: result.error });
      return;
    }

    if (!("token" in result) || !("user" in result)) {
      res.status(500).json({ error: "Login failed" });
      return;
    }

    res.cookie(customerCookieName, result.token, customerCookieOptions());
    res.json({ user: result.user, token: result.token });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PHONE") {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }
    if (error instanceof Error && error.message === "TWILIO_NOT_CONFIGURED") {
      res.status(503).json({
        error: "SMS service not configured. Add Twilio keys or set OTP_DEV_MODE=true.",
      });
      return;
    }
    if (error instanceof TwilioVerifyError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("POST /api/auth/verify-otp failed:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

authRouter.get("/me", requireCustomer, async (req: CustomerRequest, res) => {
  try {
    const user = await getCustomerProfile(req.customer!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(customerCookieName, customerCookieClearOptions());
  res.json({ ok: true });
});
