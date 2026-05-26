import type { AccountOrder } from "@/data/accountOrders";
import type { CancellationInfo } from "@/lib/cancellation";
import { getApiBaseUrl } from "@/lib/api";
import { customerFetch } from "@/lib/customerFetch";

type OrdersResponse = { orders: AccountOrder[] };
type OrderResponse = { order: AccountOrder };

export async function fetchOrders(): Promise<AccountOrder[]> {
  const data = await customerFetch<OrdersResponse>("/api/orders");
  return data.orders;
}

export async function fetchOrderById(orderId: string): Promise<AccountOrder | null> {
  try {
    const data = await customerFetch<OrderResponse>(`/api/orders/${orderId}`);
    return data.order;
  } catch {
    return null;
  }
}

export async function fetchOrderSummary(
  orderId: string,
): Promise<{ id: string; orderNumber: string; returnEligible: boolean } | null> {
  const order = await fetchOrderById(orderId);
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    returnEligible: order.returnEligible,
  };
}

export async function cancelOrder(
  orderId: string,
  input: {
    reason: import("@/lib/cancellation").CancellationReason;
    note?: string;
    policyConfirmed: boolean;
  },
): Promise<{
  order: AccountOrder;
  cancellation: CancellationInfo;
}> {
  return customerFetch(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function downloadOrderInvoice(
  orderId: string,
  orderNumber: string,
): Promise<void> {
  const response = await fetch(
    new URL(`/api/orders/${orderId}/invoice`, getApiBaseUrl()).toString(),
    { credentials: "include", cache: "no-store" },
  );

  if (response.status === 401) {
    throw new Error("LOGIN_REQUIRED");
  }

  if (!response.ok) {
    throw new Error("Failed to download invoice");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${orderNumber}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
