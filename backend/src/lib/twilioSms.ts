function normalizeIndianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (phone.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
}

export function isTwilioSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      (process.env.TWILIO_SMS_FROM?.trim() ||
        process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()),
  );
}

/** Fire-and-forget transactional SMS. Logs errors; never throws. */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  if (!accountSid || !authToken || (!from && !messagingServiceSid)) {
    console.warn("[SMS] Skipped — Twilio SMS not configured (TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID)");
    return false;
  }

  const toE164 = normalizeIndianPhone(to);
  if (!toE164) {
    console.warn("[SMS] Skipped — invalid phone:", to);
    return false;
  }

  const params = new URLSearchParams();
  params.set("To", toE164);
  params.set("Body", body.slice(0, 1600));
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else if (from) {
    params.set("From", from);
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };

    if (!res.ok) {
      console.error("[SMS] Failed:", data.message ?? res.status);
      return false;
    }

    console.log(`[SMS] Sent to ${toE164} (${data.sid ?? "ok"})`);
    return true;
  } catch (error) {
    console.error("[SMS] Error:", error);
    return false;
  }
}

export function formatPhoneForSms(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  return normalized ?? phone;
}

export function isTwilioWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  );
}

/** Fire-and-forget WhatsApp via Twilio. To must be opted in (sandbox: send join code first). */
export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromRaw = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !fromRaw) {
    console.warn("[WhatsApp] Skipped — TWILIO_WHATSAPP_FROM not configured");
    return false;
  }

  const toE164 = normalizeIndianPhone(to);
  if (!toE164) {
    console.warn("[WhatsApp] Skipped — invalid phone:", to);
    return false;
  }

  const from = fromRaw.startsWith("whatsapp:") ? fromRaw : `whatsapp:${fromRaw}`;
  const params = new URLSearchParams();
  params.set("From", from);
  params.set("To", `whatsapp:${toE164}`);
  params.set("Body", body.slice(0, 1600));

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const data = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
    };

    if (!res.ok) {
      console.error("[WhatsApp] Failed:", data.message ?? res.status);
      return false;
    }

    console.log(`[WhatsApp] Sent to ${toE164} (${data.sid ?? "ok"})`);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error:", error);
    return false;
  }
}

/** Sends SMS and WhatsApp when each channel is configured. */
export async function sendTransactionalMessage(to: string, body: string): Promise<void> {
  const [smsOk, whatsAppOk] = await Promise.all([sendSms(to, body), sendWhatsApp(to, body)]);
  if (!smsOk && !whatsAppOk) {
    console.warn(
      `[Notify] Message not delivered to ${formatPhoneForSms(to)} — configure TWILIO_SMS_FROM or TWILIO_MESSAGING_SERVICE_SID for SMS, and TWILIO_WHATSAPP_FROM for WhatsApp`,
    );
  }
}
