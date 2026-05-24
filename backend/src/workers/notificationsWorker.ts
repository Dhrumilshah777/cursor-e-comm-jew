import { sendTransactionalMessage } from "../lib/twilioSms.js";
import { startWorker, QUEUE_NAMES } from "../lib/queue.js";
import type { NotificationJobPayload } from "../lib/notificationQueue.js";

export function startNotificationsWorker() {
  const worker = startWorker<NotificationJobPayload>(
    QUEUE_NAMES.notifications,
    async (job) => {
      const { to, body, kind } = job.data;
      console.log(`[Notify:${kind}] sending to ${to.replace(/\d(?=\d{4})/g, "*")}`);
      await sendTransactionalMessage(to, body);
    },
    { concurrency: 5 },
  );

  if (worker) {
    console.log(`[Queue] notifications worker started`);
  }

  return worker;
}
