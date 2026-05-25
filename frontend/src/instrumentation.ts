import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      sendDefaultPii: false,
    });
  } else if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    });
  }
}

// Capture errors thrown in async server components / route handlers etc.
export const onRequestError = Sentry.captureRequestError;
