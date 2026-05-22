import type { AccountOrder } from "@/data/accountOrders";
import type { CancellationInfo } from "@/lib/cancellation";
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
