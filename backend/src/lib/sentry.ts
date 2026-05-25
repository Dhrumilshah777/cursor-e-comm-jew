import * as Sentry from "@sentry/node";

let initialized = false;
let warnedNoDsn = false;

/**
 * Initialize Sentry once at process startup. Safe to call when SENTRY_DSN
 * isn't set — the SDK becomes a no-op and every helper here silently does
 * nothing, so the app keeps working in dev / preview / unconfigured envs.
 *
 * Sentry must be initialized BEFORE any code we want to instrument runs,
 * so the very top of `index.ts` imports this module first.
 */
export function initSentry(): void {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    if (!warnedNoDsn && process.env.NODE_ENV === "production") {
      console.info("[Sentry] SENTRY_DSN not set — error reporting disabled.");
      warnedNoDsn = true;
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.RENDER_GIT_COMMIT?.slice(0, 12),
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    sendDefaultPii: false,
    // Drop noise that doesn't help debugging.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      /ECONNRESET/,
      /AbortError/,
    ],
  });

  initialized = true;
  console.log(`[Sentry] initialized (env=${process.env.NODE_ENV ?? "development"})`);
}

export function isSentryEnabled(): boolean {
  return initialized;
}

/**
 * Capture an error with optional structured tags/extras. Safe to call when
 * Sentry isn't configured — it just logs to console.
 */
export function captureError(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
): void {
  if (initialized) {
    Sentry.captureException(error, context);
  }
  // Always also log so Render's stdout captures it.
  console.error(error);
}

export { Sentry };
