import { sendTransactionalEmail } from "../lib/resendEmail.js";
import { sendTransactionalMessage } from "../lib/twilioSms.js";
import { startWorker, QUEUE_NAMES } from "../lib/queue.js";
import type { NotificationJobPayload } from "../lib/notificationQueue.js";

export function startNotificationsWorker() {
  const worker = startWorker<NotificationJobPayload>(
    QUEUE_NAMES.notifications,
    async (job) => {
      const payload = job.data;

      if (payload.channel === "email") {
        const masked = payload.to.replace(/(.{2}).+(@.+)/, "$1***$2");
        console.log(`[Notify:${payload.kind}] emailing ${masked}`);
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
        return;
      }

      console.log(
        `[Notify:${payload.kind}] sending SMS to ${payload.to.replace(/\d(?=\d{4})/g, "*")}`,
      );
      await sendTransactionalMessage(payload.to, payload.body);
    },
    { concurrency: 5 },
  );

  if (worker) {
    console.log(`[Queue] notifications worker started`);
  }

  return worker;
}
