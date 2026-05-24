/**
 * Pings the Next.js frontend's /api/revalidate endpoint so its ISR cache
 * for the given tags is busted immediately. Without this, the frontend
 * would still serve cached pages for up to the page's `revalidate` window
 * after an admin update.
 *
 * Best-effort: errors are logged and swallowed so admin mutations never
 * fail because of frontend caching.
 */
export async function revalidateFrontendTags(tags: string[]): Promise<void> {
  if (tags.length === 0) return;

  const secret = process.env.REVALIDATE_SECRET;
  const origin = process.env.FRONTEND_ORIGIN?.split(",")[0]?.trim();

  if (!secret || !origin) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[revalidate] FRONTEND_ORIGIN or REVALIDATE_SECRET not set — skipping ISR purge.",
      );
    }
    return;
  }

  try {
    const url = new URL("/api/revalidate", origin).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags, secret }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `[revalidate] frontend returned ${response.status} for tags: ${tags.join(", ")}`,
      );
    }
  } catch (error) {
    console.error("[revalidate] failed to notify frontend:", error);
  }
}
