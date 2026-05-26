export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

const DEFAULT_FETCH_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_API_FETCH_TIMEOUT_MS ?? 12_000,
);

/** Abort slow API calls so Vercel static generation does not hang for 60s+. */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getDemoUserPhone(): string {
  return process.env.NEXT_PUBLIC_DEMO_USER_PHONE ?? "+919876543210";
}

export async function apiFetch<T>(path: string): Promise<T> {
  const url = new URL(path, getApiBaseUrl());
  url.searchParams.set("phone", getDemoUserPhone());

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}
