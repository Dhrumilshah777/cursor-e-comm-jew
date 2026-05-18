export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
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
