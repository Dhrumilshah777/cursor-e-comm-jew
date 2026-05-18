import type { DeliveryAddress } from "@/data/accountOrders";
import type { ReturnAdminStatus, ReturnReason } from "@/data/returnRequest";

export type StoredReturnProduct = {
  slug: string;
  name: string;
  metal: string;
  purity: string;
  size?: string;
  price: string;
  image: string;
};

export type StoredReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  submittedAt: string;
  status: ReturnAdminStatus;
  product: StoredReturnProduct;
  reason: ReturnReason;
  customerNotes: string;
  productImageUrls: string[];
  packagingImageUrls: string[];
  pickupAddress: DeliveryAddress;
  policyConfirmed: boolean;
  pickupScheduledFor?: string;
  adminNotes?: string;
};

const RETURNS_STORAGE_KEY = "jewelry-return-requests";

function readAll(): StoredReturnRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RETURNS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredReturnRequest[];
  } catch {
    return [];
  }
}

function writeAll(requests: StoredReturnRequest[]) {
  localStorage.setItem(RETURNS_STORAGE_KEY, JSON.stringify(requests));
}

export function getAllReturnRequests(): StoredReturnRequest[] {
  return readAll().sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function getReturnRequestByOrderId(
  orderId: string,
): StoredReturnRequest | undefined {
  return readAll().find((request) => request.orderId === orderId);
}

export function saveReturnRequest(request: StoredReturnRequest) {
  const all = readAll().filter((entry) => entry.orderId !== request.orderId);
  all.push(request);
  writeAll(all);
}

export function updateReturnRequest(
  id: string,
  patch: Partial<StoredReturnRequest>,
): StoredReturnRequest | undefined {
  const all = readAll();
  const index = all.findIndex((entry) => entry.id === id);
  if (index === -1) return undefined;
  const updated = { ...all[index]!, ...patch };
  all[index] = updated;
  writeAll(all);
  return updated;
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  const readers = files.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }),
  );
  return Promise.all(readers);
}

export function createReturnRequestId(): string {
  return `RET-${Date.now().toString(36).toUpperCase()}`;
}
