import { Redis } from "ioredis";
import { Queue, Worker, type ConnectionOptions, type Processor, type WorkerOptions } from "bullmq";

/**
 * BullMQ requires a *separate* Redis connection from the one used for caching,
 * because workers issue blocking commands (BLPOP). The library also requires
 * `maxRetriesPerRequest: null` and `enableReadyCheck: false` for that
 * connection.
 *
 * If REDIS_URL is missing we don't create queues at all — every "enqueue" call
 * silently falls back to running the job inline so the app keeps working in
 * dev or unconfigured environments.
 */

let connection: Redis | null = null;
let warnedNoRedis = false;

export function isQueueEnabled(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

function getConnection(): Redis | null {
  if (!isQueueEnabled()) {
    if (!warnedNoRedis) {
      console.info("[Queue] REDIS_URL not set — running jobs inline (no retries, not durable).");
      warnedNoRedis = true;
    }
    return null;
  }

  if (!connection) {
    connection = new Redis(process.env.REDIS_URL!.trim(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    });
    connection.on("error", (error) => {
      console.error("[Queue] Redis connection error:", error.message);
    });
  }

  return connection;
}

export function getQueueConnection(): ConnectionOptions | null {
  const redis = getConnection();
  return redis as unknown as ConnectionOptions;
}

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue | null {
  const conn = getQueueConnection();
  if (!conn) return null;

  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: conn,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 60 * 60, count: 1000 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    });
    queues.set(name, queue);
  }
  return queue;
}

const workers: Worker[] = [];

export function startWorker<T = unknown, R = unknown>(
  name: string,
  processor: Processor<T, R>,
  options: Omit<WorkerOptions, "connection"> = {},
): Worker | null {
  const conn = getQueueConnection();
  if (!conn) return null;

  const worker = new Worker<T, R>(name, processor, {
    connection: conn,
    concurrency: 5,
    ...options,
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[Queue:${name}] Job ${job?.id ?? "?"} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}):`,
      error.message,
    );
  });

  worker.on("error", (error) => {
    console.error(`[Queue:${name}] Worker error:`, error.message);
  });

  workers.push(worker);
  return worker;
}

export async function shutdownQueues(): Promise<void> {
  console.log("[Queue] Shutting down workers and queues…");
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all([...queues.values()].map((q) => q.close()));
  if (connection) {
    await connection.quit().catch(() => connection?.disconnect());
    connection = null;
  }
}

export const QUEUE_NAMES = {
  notifications: "wj-notifications",
  refunds: "wj-refunds",
  shiprocketRetry: "wj-shiprocket-retry",
} as const;
