import { customerFetch } from "@/lib/customerFetch";

export type CustomerReturnSummary = {
  id: string;
  status: string;
  statusLabel: string;
  reason: string;
  submittedAt: string;
  pickupScheduledFor: string | null;
  reversePickupAt: string | null;
  refundStatus: string | null;
  productSlug: string;
  productName: string;
  timeline: {
    status: string;
    label: string;
    note: string | null;
    date: string;
    eventAt: string;
  }[];
};

export async function submitReturnRequest(body: {
  orderId: string;
  orderItemId: string;
  reason: string;
  customerNotes?: string;
  policyConfirmed: boolean;
  pickupAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  productImageUrls?: string[];
  packagingImageUrls?: string[];
}): Promise<CustomerReturnSummary> {
  const data = await customerFetch<{ return: CustomerReturnSummary }>("/api/returns", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.return;
}

export async function fetchReturnForOrder(
  orderId: string,
): Promise<CustomerReturnSummary | null> {
  try {
    const data = await customerFetch<{ return: CustomerReturnSummary }>(
      `/api/returns/order/${orderId}`,
    );
    return data.return;
  } catch {
    return null;
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map(fileToDataUrl));
}
