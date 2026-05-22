import type { MetalType, Product } from "../generated/prisma/client.js";
import { mapOrderToDto } from "../lib/orderMapper.js";
import { notifyAdminOrderPlaced, notifyOrderConfirmed } from "../lib/notifications.js";
import { prisma } from "../lib/prisma.js";
import {
  applyCouponToCheckoutTotals,
  incrementCouponUsage,
  listAvailableCouponsForCheckout,
} from "./coupons.js";
import {
  calculatePriceBreakup,
  calculateProductPricePaise,
  purityFromDb,
  type ProductMakingCharge,
} from "../lib/pricing.js";

export type CheckoutAddressInput = {
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

type CartItemWithProduct = {
  id: string;
  quantity: number;
  size: string;
  product: Product;
};

function makingChargeFromProduct(product: Product): ProductMakingCharge {
  return {
    type: product.makingChargeKind === "PERCENTAGE" ? "percentage" : "fixed",
    value: Number.parseFloat(product.makingChargeValue.toString()),
  };
}

function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

async function generateOrderNumber(): Promise<string> {
  const latest = await prisma.order.findFirst({
    orderBy: { placedAt: "desc" },
    select: { orderNumber: true },
  });

  if (latest?.orderNumber.startsWith("DJ-")) {
    const numeric = Number.parseInt(latest.orderNumber.slice(3), 10);
    if (!Number.isNaN(numeric)) {
      return `DJ-${numeric + 1}`;
    }
  }

  const count = await prisma.order.count();
  return `DJ-${24000 + count + 1}`;
}

export function validateCheckoutAddress(input: CheckoutAddressInput): string | null {
  if (!input.name?.trim()) return "Name is required";
  if (!input.line1?.trim()) return "Address line 1 is required";
  if (!input.city?.trim()) return "City is required";
  if (!input.state?.trim()) return "State is required";
  if (!/^\d{6}$/.test(input.pincode?.trim() ?? "")) return "Valid 6-digit pincode is required";
  if (!/^\d{10}$/.test(input.phone?.replace(/\D/g, "").slice(-10) ?? "")) {
    return "Valid 10-digit phone is required";
  }
  return null;
}

async function resolveDeliveryAddress(
  userId: string,
  addressId?: string,
  addressInput?: CheckoutAddressInput,
) {
  if (addressId) {
    const saved = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!saved) return { error: "ADDRESS_NOT_FOUND" as const };
    return { addressId: saved.id };
  }

  if (!addressInput) {
    return { error: "ADDRESS_REQUIRED" as const };
  }

  const validationError = validateCheckoutAddress(addressInput);
  if (validationError) {
    return { error: "INVALID_ADDRESS" as const, message: validationError };
  }

  const phoneDigits = addressInput.phone.replace(/\D/g, "").slice(-10);

  const created = await prisma.address.create({
    data: {
      userId,
      label: addressInput.saveAddress
        ? addressInput.label?.trim() || "Home"
        : "Checkout",
      name: addressInput.name.trim(),
      line1: addressInput.line1.trim(),
      line2: addressInput.line2?.trim() || null,
      city: addressInput.city.trim(),
      state: addressInput.state.trim(),
      pincode: addressInput.pincode.trim(),
      phone: `+91${phoneDigits}`,
      isDefault: false,
    },
  });

  return { addressId: created.id };
}

export async function getCartCheckoutTotals(userId: string, couponCode?: string | null) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "CART_EMPTY" as const };
  }

  const inactive = cart.items.find((item) => !item.product.isActive);
  if (inactive) {
    return { error: "PRODUCT_UNAVAILABLE" as const };
  }

  let subtotalPaise = 0;

  for (const item of cart.items as CartItemWithProduct[]) {
    subtotalPaise += calculateProductPricePaise(item.product) * item.quantity;
  }

  const shippingPaise = 0;
  const totals = await applyCouponToCheckoutTotals(
    userId,
    subtotalPaise,
    shippingPaise,
    couponCode,
  );

  if ("error" in totals) {
    return totals;
  }

  return { ...totals, cart };
}

export async function previewCheckoutCoupon(userId: string, couponCode: string) {
  const base = await getCartCheckoutTotals(userId);
  if ("error" in base) {
    return base;
  }

  return getCartCheckoutTotals(userId, couponCode);
}

export async function listAvailableCheckoutCoupons(userId: string): Promise<
  | { error: "CART_EMPTY" }
  | { error: "PRODUCT_UNAVAILABLE" }
  | { subtotalPaise: number; coupons: Awaited<ReturnType<typeof listAvailableCouponsForCheckout>> }
> {
  const totals = await getCartCheckoutTotals(userId);
  if ("error" in totals && totals.error) {
    if (totals.error === "CART_EMPTY" || totals.error === "PRODUCT_UNAVAILABLE") {
      return { error: totals.error };
    }
  }
  if (!("cart" in totals)) {
    return { error: "CART_EMPTY" };
  }

  const coupons = await listAvailableCouponsForCheckout(userId, totals.subtotalPaise);
  return { subtotalPaise: totals.subtotalPaise, coupons };
}

export async function placeOrderFromCart(
  userId: string,
  input: {
    addressId?: string;
    address?: CheckoutAddressInput;
    paymentMethod: string;
    transactionId: string;
    couponId?: string | null;
    couponCode?: string | null;
    discountPaise?: number;
  },
) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "CART_EMPTY" as const };
  }

  const inactive = cart.items.find((item) => !item.product.isActive);
  if (inactive) {
    return { error: "PRODUCT_UNAVAILABLE" as const };
  }

  const addressResult = await resolveDeliveryAddress(
    userId,
    input.addressId,
    input.address,
  );

  if ("error" in addressResult) {
    return addressResult;
  }

  let goldValuePaise = 0;
  let makingChargePaise = 0;
  let gstPaise = 0;
  let subtotalPaise = 0;

  const orderItemsData = cart.items.map((item: CartItemWithProduct) => {
    const netWeightGrams = Number.parseFloat(item.product.weightGrams.toString());
    const breakup = calculatePriceBreakup({
      netWeightGrams,
      purity: purityFromDb(item.product.purity),
      makingCharge: makingChargeFromProduct(item.product),
      gstPercent: item.product.gstPercent,
    });

    const unitPricePaise = calculateProductPricePaise(item.product);
    const lineGold = rupeesToPaise(breakup.goldValue) * item.quantity;
    const lineMaking = rupeesToPaise(breakup.makingCharge) * item.quantity;
    const lineGst = rupeesToPaise(breakup.gst) * item.quantity;
    const lineTotal = unitPricePaise * item.quantity;

    goldValuePaise += lineGold;
    makingChargePaise += lineMaking;
    gstPaise += lineGst;
    subtotalPaise += lineTotal;

    return {
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.image,
      metal: item.product.metal as MetalType,
      purity: item.product.purity,
      size: item.size || null,
      quantity: item.quantity,
      unitPricePaise,
    };
  });

  const shippingPaise = 0;
  const discountPaise = input.discountPaise ?? 0;

  let couponId: string | null = input.couponId ?? null;
  let couponCode: string | null = input.couponCode ?? null;

  if (couponCode) {
    const couponTotals = await applyCouponToCheckoutTotals(
      userId,
      subtotalPaise,
      shippingPaise,
      couponCode,
    );
    if ("error" in couponTotals) {
      return couponTotals;
    }
    if (!couponTotals.coupon) {
      return { error: "COUPON_NOT_FOUND" as const, message: "Invalid coupon code" };
    }
    couponId = couponTotals.coupon.couponId;
    couponCode = couponTotals.coupon.code;
    if (couponTotals.discountPaise !== discountPaise) {
      return { error: "PAYMENT_AMOUNT_MISMATCH" as const };
    }
  } else if (discountPaise > 0) {
    return { error: "PAYMENT_AMOUNT_MISMATCH" as const };
  }

  const totalPaise = subtotalPaise + shippingPaise - discountPaise;

  const orderNumber = await generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        deliveryAddressId: addressResult.addressId,
        status: "PROCESSING",
        totalPaise,
        goldValuePaise,
        makingChargePaise,
        gstPaise,
        shippingPaise,
        discountPaise,
        couponId,
        couponCode,
        paymentMethod: input.paymentMethod,
        paymentStatus: "Paid Successfully",
        transactionId: input.transactionId,
        items: {
          create: orderItemsData,
        },
        statusEvents: {
          create: {
            status: "PROCESSING",
            label: "Order Confirmed",
            note: "Payment received via Razorpay.",
          },
        },
      },
      include: {
        items: { include: { product: true } },
        deliveryAddress: true,
        statusEvents: { orderBy: { eventAt: "asc" } },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() },
    });

    if (couponId) {
      await incrementCouponUsage(tx, couponId);
    }

    return created;
  });

  const orderWithUser = await prisma.order.findUnique({
    where: { id: order.id },
    include: { user: { select: { phone: true, name: true } } },
  });

  if (orderWithUser?.user.phone) {
    void notifyOrderConfirmed({
      customerPhone: orderWithUser.user.phone,
      orderNumber: order.orderNumber,
      totalPaise: order.totalPaise,
    });
    void notifyAdminOrderPlaced({
      orderNumber: order.orderNumber,
      totalPaise: order.totalPaise,
      customerPhone: orderWithUser.user.phone,
      customerName: orderWithUser.user.name,
    });
  }

  return { order: mapOrderToDto(order) };
}
