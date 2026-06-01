import { sendTransactionalEmail } from "./resendEmail.js";
import { sendTransactionalMessage } from "./twilioSms.js";
import { getQueue, QUEUE_NAMES } from "./queue.js";

export type SmsNotificationJob = {
  channel: "sms";
  kind: string;
  to: string;
  body: string;
};

/** SMS + WhatsApp (when TWILIO_WHATSAPP_FROM is set). */
export type PhoneNotificationJob = SmsNotificationJob;

export type EmailNotificationJob = {
  channel: "email";
  kind: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: {
    filename: string;
    contentBase64: string;
  };
};

export type NotificationJobPayload = SmsNotificationJob | EmailNotificationJob;

async function deliverNotification(payload: NotificationJobPayload): Promise<void> {
  if (payload.channel === "sms") {
    await sendTransactionalMessage(payload.to, payload.body);
    return;
  }

  await sendTransactionalEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    ...(payload.attachment
      ? {
          attachment: {
            filename: payload.attachment.filename,
            content: Buffer.from(payload.attachment.contentBase64, "base64"),
          },
        }
      : {}),
  });
}

export async function enqueueNotification(payload: NotificationJobPayload): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.notifications);

  if (!queue) {
    void deliverNotification(payload).catch((error) => {
      console.error(`[Notify:${payload.kind}] inline send failed:`, error);
    });
    return;
  }

  try {
    await queue.add(payload.kind, payload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
    });
  } catch (error) {
    console.error(`[Notify:${payload.kind}] enqueue failed, sending inline:`, error);
    void deliverNotification(payload).catch((sendError) => {
      console.error(`[Notify:${payload.kind}] inline send also failed:`, sendError);
    });
  }
}

export async function enqueueEmailNotification(
  payload: Omit<EmailNotificationJob, "channel">,
  options?: { jobId?: string },
): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.notifications);

  const jobPayload: EmailNotificationJob = { channel: "email", ...payload };

  if (!queue) {
    void deliverNotification(jobPayload).catch((error) => {
      console.error(`[Notify:${payload.kind}] inline send failed:`, error);
    });
    return;
  }

  try {
    await queue.add(payload.kind, jobPayload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      ...(options?.jobId ? { jobId: options.jobId } : {}),
    });
  } catch (error) {
    console.error(`[Notify:${payload.kind}] enqueue failed, sending inline:`, error);
    void deliverNotification(jobPayload).catch((sendError) => {
      console.error(`[Notify:${payload.kind}] inline send also failed:`, sendError);
    });
  }
}

export async function enqueuePhoneNotification(
  payload: Omit<PhoneNotificationJob, "channel">,
  options?: { jobId?: string },
): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.notifications);
  const jobPayload: PhoneNotificationJob = { channel: "sms", ...payload };

  if (!queue) {
    void deliverNotification(jobPayload).catch((error) => {
      console.error(`[Notify:${payload.kind}] inline send failed:`, error);
    });
    return;
  }

  try {
    await queue.add(payload.kind, jobPayload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      ...(options?.jobId ? { jobId: options.jobId } : {}),
    });
  } catch (error) {
    console.error(`[Notify:${payload.kind}] enqueue failed, sending inline:`, error);
    void deliverNotification(jobPayload).catch((sendError) => {
      console.error(`[Notify:${payload.kind}] inline send also failed:`, sendError);
    });
  }
}

/** @deprecated Use enqueuePhoneNotification — sends SMS and WhatsApp when configured. */
export async function enqueueSmsNotification(
  payload: Omit<SmsNotificationJob, "channel">,
  options?: { jobId?: string },
): Promise<void> {
  await enqueuePhoneNotification(payload, options);
}
