import { getApiBaseUrl } from "@/lib/api";
import { getCustomerToken } from "@/lib/customerAuth";

export async function customerFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getCustomerToken();
  if (!token) {
    throw new Error("LOGIN_REQUIRED");
  }

  const response = await fetch(new URL(path, getApiBaseUrl()).toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    credentials: "include",
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };

  if (response.status === 401) {
    throw new Error("LOGIN_REQUIRED");
  }

  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }

  return body as T;
}
