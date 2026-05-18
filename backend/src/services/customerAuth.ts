import { prisma } from "../lib/prisma.js";
import {
  normalizeIndianPhone,
  signCustomerToken,
} from "../lib/customerAuth.js";
import {
  checkTwilioVerification,
  isTwilioVerifyConfigured,
  sendTwilioVerification,
} from "../lib/twilioVerify.js";

const OTP_TTL_MS = 10 * 60 * 1000;

function isDevMode(): boolean {
  return process.env.OTP_DEV_MODE === "true";
}

function generateOtpCode(): string {
  if (isDevMode()) {
    return process.env.OTP_DEV_CODE ?? "123456";
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpDev(phone: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpCode.deleteMany({ where: { phone } });
  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  });
}

async function verifyOtpDev(phone: string, otp: string) {
  const record = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "OTP_EXPIRED" as const };
  }

  if (record.code !== otp.trim()) {
    return { error: "OTP_INVALID" as const };
  }

  await prisma.otpCode.deleteMany({ where: { phone } });
  return { ok: true as const };
}

async function findOrCreateUser(phone: string) {
  return (
    (await prisma.user.findUnique({ where: { phone } })) ??
    (await prisma.user.create({
      data: { phone },
    }))
  );
}

export async function sendLoginOtp(rawPhone: string, options?: { resend?: boolean }) {
  const phone = normalizeIndianPhone(rawPhone);
  const resend = options?.resend === true;

  if (isDevMode()) {
    if (resend) {
      const code = generateOtpCode();
      await sendOtpDev(phone, code);
      return {
        ok: true as const,
        phone,
        message: "OTP sent successfully",
        devOtp: code,
        resent: true,
      };
    }

    const existing = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });

    const code = generateOtpCode();
    await sendOtpDev(phone, code);
    return {
      ok: true as const,
      phone,
      message: "OTP sent successfully",
      devOtp: code,
    };
  }

  if (!isTwilioVerifyConfigured()) {
    throw new Error("TWILIO_NOT_CONFIGURED");
  }

  const twilioResult = await sendTwilioVerification(phone, { forceNew: resend });

  return {
    ok: true as const,
    phone,
    verificationSid: twilioResult.verificationSid,
    message: resend ? "A new code was sent to your phone." : "OTP sent successfully",
    resent: resend,
  };
}

export async function verifyLoginOtp(
  rawPhone: string,
  otp: string,
  verificationSid?: string,
) {
  const phone = normalizeIndianPhone(rawPhone);

  if (isDevMode()) {
    const check = await verifyOtpDev(phone, otp);
    if ("error" in check) {
      return check;
    }
  } else {
    if (!isTwilioVerifyConfigured()) {
      throw new Error("TWILIO_NOT_CONFIGURED");
    }

    const status = await checkTwilioVerification(phone, otp, verificationSid);
    if (status === "expired") {
      return { error: "OTP_EXPIRED" as const };
    }
    if (status === "invalid") {
      return { error: "OTP_INVALID" as const };
    }
  }

  const user = await findOrCreateUser(phone);
  const token = signCustomerToken({ userId: user.id, phone: user.phone });

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
    },
  };
}

export async function getCustomerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, name: true, email: true, createdAt: true },
  });
}
