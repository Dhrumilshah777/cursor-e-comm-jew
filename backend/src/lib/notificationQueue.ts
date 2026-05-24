import { sendTransactionalMessage } from "./twilioSms.js";
import { getQueue, QUEUE_NAMES } from "./queue.js";

export type NotificationJobPayload = {
  to: string;
  body: string;
  /** Free-form label so we can identify what kind of message in logs. */
  kind: string;
};

/**
 * Enqueue a transactional SMS + WhatsApp send. If the queue is not configured
 * (no REDIS_URL), falls back to running the send inline so the app still works
 * in dev. Always returns immediately; senders never block on SMS delivery.
 */
export async function enqueueNotification(payload: NotificationJobPayload): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.notifications);

  if (!queue) {
    void sendTransactionalMessage(payload.to, payload.body).catch((error) => {
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
    void sendTransactionalMessage(payload.to, payload.body).catch((sendError) => {
      console.error(`[Notify:${payload.kind}] inline send also failed:`, sendError);
    });
  }
}
