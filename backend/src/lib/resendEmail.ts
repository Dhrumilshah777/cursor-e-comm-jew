import { Resend } from "resend";

let client: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

/** Verified sender in Resend dashboard. Falls back to Resend onboarding address. */
export function getEmailFromAddress(): string {
  return (
    process.env.RESEND_FROM?.trim() ||
    "Wholesale Jewelry <onboarding@resend.dev>"
  );
}

export function getStoreFrontendUrl(): string {
  const origin = process.env.FRONTEND_ORIGIN?.split(",")[0]?.trim();
  return origin || "http://localhost:3000";
}

export function adminAlertEmail(): string | null {
  return process.env.ADMIN_ALERT_EMAIL?.trim().toLowerCase() || null;
}

export function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: {
    filename: string;
    content: Buffer;
  };
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Email] Skipped — RESEND_API_KEY not configured");
    return false;
  }

  const to = input.to.trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.warn("[Email] Skipped — invalid recipient:", input.to);
    return false;
  }

  try {
    const result = await resend.emails.send({
      from: getEmailFromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.attachment
        ? {
            attachments: [
              {
                filename: input.attachment.filename,
                content: input.attachment.content,
              },
            ],
          }
        : {}),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return false;
  }
}
