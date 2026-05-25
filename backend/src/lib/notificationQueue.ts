import { sendTransactionalEmail } from "./resendEmail.js";
import { sendTransactionalMessage } from "./twilioSms.js";
import { getQueue, QUEUE_NAMES } from "./queue.js";

export type SmsNotificationJob = {
  channel: "sms";
  kind: string;
  to: string;
  body: string;
};

export type EmailNotificationJob = {
  channel: "email";
  kind: string;
  to: string;
  subject: string;
  html: string;
  text: string;
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
): Promise<void> {
  await enqueueNotification({ channel: "email", ...payload });
}

export async function enqueueSmsNotification(
  payload: Omit<SmsNotificationJob, "channel">,
): Promise<void> {
  await enqueueNotification({ channel: "sms", ...payload });
}
