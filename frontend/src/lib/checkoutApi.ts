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

export type CheckoutContact = {
  email: string;
};

export type SavedCheckoutAddress = {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export async function fetchCheckoutAddresses() {
  const data = await customerFetch<{ addresses: SavedCheckoutAddress[] }>(
    "/api/checkout/addresses",
  );
  return data.addresses;
}

export async function updateCheckoutAddress(
  addressId: string,
  address: CheckoutAddress,
) {
  const data = await customerFetch<{ address: SavedCheckoutAddress }>(
    `/api/checkout/addresses/${encodeURIComponent(addressId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(address),
    },
  );
  return data.address;
}

export async function deleteCheckoutAddress(addressId: string) {
  await customerFetch<{ ok: true }>(
    `/api/checkout/addresses/${encodeURIComponent(addressId)}`,
    { method: "DELETE" },
  );
}

type RazorpayCreateOrderResponse = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  coupon?: {
    couponId: string;
    code: string;
    type: string;
    discountPaise: number;
    discount: string;
    valueLabel: string;
  } | null;
};

export type AppliedCheckoutCoupon = NonNullable<RazorpayCreateOrderResponse["coupon"]>;

export type CheckoutCouponPreview = {
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  coupon: AppliedCheckoutCoupon | null;
};

export type AvailableCheckoutCoupon = {
  code: string;
  valueLabel: string;
  minOrder: string | null;
  validUntil: string | null;
  canApply: boolean;
  reason: string | null;
  estimatedDiscount: string | null;
};

export async function fetchAvailableCheckoutCoupons() {
  const data = await customerFetch<{ coupons: AvailableCheckoutCoupon[] }>(
    "/api/checkout/coupons",
  );
  return data.coupons;
}

export async function applyCheckoutCoupon(code: string) {
  return customerFetch<CheckoutCouponPreview>("/api/checkout/apply-coupon", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

type VerifyResponse = { order: AccountOrder };

export async function createRazorpayCheckoutOrder(
  payload: ({ address: CheckoutAddress } | { addressId: string }) & {
    email: string;
    couponCode?: string;
  },
) {
  return customerFetch<RazorpayCreateOrderResponse>("/api/checkout/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
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
