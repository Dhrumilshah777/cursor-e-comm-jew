import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pinimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "palmonas.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "emori.in",
        pathname: "/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry CLI is only invoked when SENTRY_AUTH_TOKEN + SENTRY_ORG +
  // SENTRY_PROJECT are set (typically only on CI / Vercel). Without them
  // the wrapper is a no-op and the build still succeeds locally.
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Skip Sentry's own usage telemetry.
  telemetry: false,
});
