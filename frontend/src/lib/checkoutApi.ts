import type { AccountOrder } from "@/data/accountOrders";
import { customerFetch } from "@/lib/customerFetch";

export type CheckoutAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  label?: string;
  saveAddress?: boolean;
};

type RazorpayCreateOrderResponse = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
};

type VerifyResponse = { order: AccountOrder };

export async function createRazorpayCheckoutOrder(address: CheckoutAddress) {
  return customerFetch<RazorpayCreateOrderResponse>("/api/checkout/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}

export async function verifyRazorpayPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const data = await customerFetch<VerifyResponse>("/api/checkout/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.order;
}
