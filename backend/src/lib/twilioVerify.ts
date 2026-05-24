import {
  cacheDel,
  cacheGetJson,
  cacheSetJson,
  cacheSetNx,
  redisKeys,
} from "./redis.js";

type PendingVerification = {
  sid: string;
  sentAt: number;
};

type VerificationResource = {
  sid: string;
  status: string;
  to?: string;
};

type TwilioErrorBody = {
  code?: number;
  message?: string;
  status?: number;
};

export class TwilioVerifyError extends Error {
  readonly twilioCode?: number;

  constructor(body: TwilioErrorBody) {
    super(body.message ?? "Twilio Verify request failed");
    this.name = "TwilioVerifyError";
    this.twilioCode = body.code;
  }
}

export class OtpRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(`Please wait ${retryAfterSeconds} seconds before requesting a new code.`);
    this.name = "OtpRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const MIN_RESEND_INTERVAL_MS = 30_000;
const OTP_PENDING_TTL_SECONDS = 10 * 60;
const OTP_SEND_LOCK_TTL_SECONDS = 60;

export function isTwilioVerifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

async function twilioVerifyRequest<T>(
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("TWILIO_NOT_CONFIGURED");
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body) : undefined,
  });

  const data = (await res.json()) as T & TwilioErrorBody;

  if (!res.ok) {
    throw new TwilioVerifyError(data);
  }

  return data;
}

async function cancelTwilioVerification(sid: string): Promise<void> {
  try {
    await twilioVerifyRequest<VerificationResource>(`/Verifications/${sid}`, {
      Status: "canceled",
    });
  } catch (error) {
    if (error instanceof TwilioVerifyError && error.twilioCode === 20404) {
      return;
    }
    throw error;
  }
}

async function getPendingVerification(phone: string): Promise<PendingVerification | null> {
  return cacheGetJson<PendingVerification>(redisKeys.otpPending(phone));
}

async function setPendingVerification(
  phone: string,
  pending: PendingVerification,
): Promise<void> {
  await cacheSetJson(redisKeys.otpPending(phone), pending, OTP_PENDING_TTL_SECONDS);
}

async function cancelPendingForPhone(phone: string): Promise<void> {
  const pending = await getPendingVerification(phone);
  if (!pending) return;
  await cancelTwilioVerification(pending.sid);
  await cacheDel(redisKeys.otpPending(phone));
}

export async function clearTwilioVerificationState(phone: string): Promise<void> {
  await cacheDel(redisKeys.otpPending(phone));
}

export type SendTwilioVerificationResult = {
  sent: boolean;
  verificationSid: string;
};

async function sendTwilioVerificationInternal(
  phone: string,
  options?: { forceNew?: boolean },
): Promise<SendTwilioVerificationResult> {
  const now = Date.now();
  const forceNew = options?.forceNew === true;
  const pending = await getPendingVerification(phone);

  if (forceNew && pending) {
    const elapsed = now - pending.sentAt;
    if (elapsed < MIN_RESEND_INTERVAL_MS) {
      const retryAfterSeconds = Math.ceil((MIN_RESEND_INTERVAL_MS - elapsed) / 1000);
      throw new OtpRateLimitError(retryAfterSeconds);
    }
    await cancelPendingForPhone(phone);
  }

  const result = await twilioVerifyRequest<VerificationResource>("/Verifications", {
    To: phone,
    Channel: "sms",
  });

  await setPendingVerification(phone, { sid: result.sid, sentAt: now });
  return { sent: true, verificationSid: result.sid };
}

export async function sendTwilioVerification(
  phone: string,
  options?: { forceNew?: boolean },
): Promise<SendTwilioVerificationResult> {
  const inflightKey = `${phone}:${options?.forceNew === true}`;
  const lockKey = redisKeys.otpSendLock(inflightKey);
  const acquired = await cacheSetNx(lockKey, "1", OTP_SEND_LOCK_TTL_SECONDS);

  if (!acquired) {
    const pending = await getPendingVerification(phone);
    if (pending) {
      return { sent: true, verificationSid: pending.sid };
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    const pendingAfterWait = await getPendingVerification(phone);
    if (pendingAfterWait) {
      return { sent: true, verificationSid: pendingAfterWait.sid };
    }
  }

  try {
    return await sendTwilioVerificationInternal(phone, options);
  } finally {
    await cacheDel(lockKey);
  }
}

type VerificationCheckResult = {
  status: string;
  valid?: boolean;
};

export async function checkTwilioVerification(
  phone: string,
  code: string,
  verificationSid?: string,
): Promise<"approved" | "invalid" | "expired"> {
  const pending = await getPendingVerification(phone);
  const sid = verificationSid ?? pending?.sid;
  const checkPayload: Record<string, string> = { Code: code.trim() };

  if (sid) {
    checkPayload.VerificationSid = sid;
  } else {
    checkPayload.To = phone;
  }

  try {
    const result = await twilioVerifyRequest<VerificationCheckResult>(
      "/VerificationCheck",
      checkPayload,
    );

    if (result.status === "approved") {
      await clearTwilioVerificationState(phone);
      return "approved";
    }

    return "invalid";
  } catch (error) {
    if (error instanceof TwilioVerifyError) {
      if (error.twilioCode === 20404) {
        await clearTwilioVerificationState(phone);

        if (sid) {
          return checkTwilioVerificationWithTo(phone, code);
        }

        return "expired";
      }
      if (error.twilioCode === 60202 || error.twilioCode === 60200) {
        return "invalid";
      }
    }
    throw error;
  }
}

async function checkTwilioVerificationWithTo(
  phone: string,
  code: string,
): Promise<"approved" | "invalid" | "expired"> {
  try {
    const result = await twilioVerifyRequest<VerificationCheckResult>(
      "/VerificationCheck",
      { To: phone, Code: code.trim() },
    );

    if (result.status === "approved") {
      await clearTwilioVerificationState(phone);
      return "approved";
    }

    return "invalid";
  } catch (error) {
    if (error instanceof TwilioVerifyError && error.twilioCode === 20404) {
      return "expired";
    }
    if (error instanceof TwilioVerifyError && (error.twilioCode === 60202 || error.twilioCode === 60200)) {
      return "invalid";
    }
    throw error;
  }
}
