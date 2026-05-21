import { getApiBaseUrl } from "@/lib/api";

const PENDING_PHONE_KEY = "login_pending_phone";
const PENDING_VERIFICATION_SID_KEY = "login_pending_verification_sid";
const LEGACY_TOKEN_KEY = "customer_token";

export const CUSTOMER_AUTH_CHANGED_EVENT = "customer-auth-changed";

export type CustomerUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
};

export function notifyCustomerAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CUSTOMER_AUTH_CHANGED_EVENT));
  }
}

function clearLegacyCustomerToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? digits : phone;
}

export function setPendingPhone(phone: string) {
  sessionStorage.setItem(PENDING_PHONE_KEY, phone);
}

export function getPendingPhone(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_PHONE_KEY);
}

export function clearPendingPhone() {
  sessionStorage.removeItem(PENDING_PHONE_KEY);
  sessionStorage.removeItem(PENDING_VERIFICATION_SID_KEY);
}

export function setPendingVerificationSid(sid: string) {
  sessionStorage.setItem(PENDING_VERIFICATION_SID_KEY, sid);
}

export function getPendingVerificationSid(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_VERIFICATION_SID_KEY);
}

export async function sendLoginOtp(phoneDigits: string, options?: { resend?: boolean }) {
  const response = await fetch(new URL("/api/auth/send-otp", getApiBaseUrl()).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone: phoneDigits, resend: options?.resend ?? false }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    phone?: string;
    devOtp?: string;
    message?: string;
    retryAfterSeconds?: number;
    verificationSid?: string;
  };

  if (!response.ok) {
    if (response.status === 429 && body.retryAfterSeconds) {
      throw new Error(
        `Please wait ${body.retryAfterSeconds} seconds before requesting a new code.`,
      );
    }
    throw new Error(body.error ?? "Failed to send OTP");
  }

  if (body.phone) {
    setPendingPhone(body.phone);
  }
  if (body.verificationSid) {
    setPendingVerificationSid(body.verificationSid);
  }

  return body;
}

export async function verifyLoginOtp(phone: string, otp: string) {
  const verificationSid = getPendingVerificationSid();
  const response = await fetch(
    new URL("/api/auth/verify-otp", getApiBaseUrl()).toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone, otp, verificationSid }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    user?: CustomerUser;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to verify OTP");
  }

  clearLegacyCustomerToken();
  clearPendingPhone();
  notifyCustomerAuthChanged();
  return body.user!;
}

export async function fetchCustomerMe(): Promise<CustomerUser | null> {
  const response = await fetch(new URL("/api/auth/me", getApiBaseUrl()).toString(), {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    clearLegacyCustomerToken();
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  const data = (await response.json()) as { user: CustomerUser };
  return data.user;
}

export async function customerLogout() {
  try {
    await fetch(new URL("/api/auth/logout", getApiBaseUrl()).toString(), {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearLegacyCustomerToken();
    clearPendingPhone();
    notifyCustomerAuthChanged();
  }
}
