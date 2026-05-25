import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

// Required by the Sentry Next.js SDK to instrument client-side route
// transitions for performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
