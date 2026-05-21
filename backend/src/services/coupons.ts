import type { Coupon, CouponType } from "../generated/prisma/client.js";
import { formatPaise } from "../lib/format.js";
import { prisma } from "../lib/prisma.js";

const RAZORPAY_MIN_PAISE = 100;

export type CouponValidationError =
  | "COUPON_NOT_FOUND"
  | "COUPON_INACTIVE"
  | "COUPON_NOT_STARTED"
  | "COUPON_EXPIRED"
  | "COUPON_MIN_ORDER"
  | "COUPON_USAGE_LIMIT"
  | "COUPON_USER_LIMIT"
  | "COUPON_ORDER_TOO_SMALL";

export type AppliedCoupon = {
  couponId: string;
  code: string;
  type: CouponType;
  discountPaise: number;
  discount: string;
  valueLabel: string;
};

export type CheckoutTotalsWithCoupon = {
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  coupon: AppliedCoupon | null;
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function couponValueLabel(coupon: Pick<Coupon, "type" | "value">): string {
  if (coupon.type === "PERCENTAGE") {
    return `${coupon.value}% off`;
  }
  return `${formatPaise(coupon.value)} off`;
}

export function calculateDiscountPaise(
  coupon: Pick<Coupon, "type" | "value" | "maxDiscountPaise">,
  subtotalPaise: number,
): number {
  let discountPaise = 0;

  if (coupon.type === "PERCENTAGE") {
    discountPaise = Math.round((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountPaise != null) {
      discountPaise = Math.min(discountPaise, coupon.maxDiscountPaise);
    }
  } else {
    discountPaise = coupon.value;
  }

  discountPaise = Math.min(discountPaise, subtotalPaise);

  const totalAfterDiscount = subtotalPaise - discountPaise;
  if (totalAfterDiscount > 0 && totalAfterDiscount < RAZORPAY_MIN_PAISE) {
    discountPaise = Math.max(0, subtotalPaise - RAZORPAY_MIN_PAISE);
  }

  return discountPaise;
}

export async function validateCouponForCheckout(
  userId: string,
  code: string,
  subtotalPaise: number,
): Promise<
  | { coupon: Coupon; discountPaise: number }
  | { error: CouponValidationError; message: string }
> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { error: "COUPON_NOT_FOUND", message: "Invalid coupon code" };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) {
    return { error: "COUPON_NOT_FOUND", message: "Coupon code not found" };
  }

  if (!coupon.isActive) {
    return { error: "COUPON_INACTIVE", message: "This coupon is no longer active" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { error: "COUPON_NOT_STARTED", message: "This coupon is not active yet" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { error: "COUPON_EXPIRED", message: "This coupon has expired" };
  }

  if (coupon.minOrderPaise != null && subtotalPaise < coupon.minOrderPaise) {
    return {
      error: "COUPON_MIN_ORDER",
      message: `Minimum order value is ${formatPaise(coupon.minOrderPaise)}`,
    };
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { error: "COUPON_USAGE_LIMIT", message: "This coupon has reached its usage limit" };
  }

  if (coupon.usageLimitPerUser != null) {
    const userUses = await prisma.order.count({
      where: { userId, couponId: coupon.id },
    });
    if (userUses >= coupon.usageLimitPerUser) {
      return {
        error: "COUPON_USER_LIMIT",
        message: "You have already used this coupon",
      };
    }
  }

  const discountPaise = calculateDiscountPaise(coupon, subtotalPaise);
  if (discountPaise <= 0) {
    return {
      error: "COUPON_ORDER_TOO_SMALL",
      message: "This coupon cannot be applied to this order",
    };
  }

  return { coupon, discountPaise };
}

export function buildAppliedCoupon(coupon: Coupon, discountPaise: number): AppliedCoupon {
  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discountPaise,
    discount: formatPaise(discountPaise),
    valueLabel: couponValueLabel(coupon),
  };
}

export async function applyCouponToCheckoutTotals(
  userId: string,
  subtotalPaise: number,
  shippingPaise: number,
  couponCode?: string | null,
): Promise<
  | CheckoutTotalsWithCoupon
  | { error: CouponValidationError; message: string }
> {
  if (!couponCode?.trim()) {
    return {
      subtotalPaise,
      shippingPaise,
      discountPaise: 0,
      totalPaise: subtotalPaise + shippingPaise,
      coupon: null,
    };
  }

  const result = await validateCouponForCheckout(userId, couponCode, subtotalPaise);
  if ("error" in result) {
    return result;
  }

  const totalPaise = subtotalPaise + shippingPaise - result.discountPaise;

  return {
    subtotalPaise,
    shippingPaise,
    discountPaise: result.discountPaise,
    totalPaise,
    coupon: buildAppliedCoupon(result.coupon, result.discountPaise),
  };
}

export async function incrementCouponUsage(
  tx: Pick<typeof prisma, "coupon">,
  couponId: string,
) {
  await tx.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}

export type AvailableCheckoutCouponDto = {
  code: string;
  valueLabel: string;
  minOrder: string | null;
  validUntil: string | null;
  canApply: boolean;
  reason: string | null;
  estimatedDiscount: string | null;
};

function formatValidUntil(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function listAvailableCouponsForCheckout(
  userId: string,
  subtotalPaise: number,
): Promise<AvailableCheckoutCouponDto[]> {
  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const visible = coupons.filter(
    (coupon) => coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit,
  );

  return Promise.all(
    visible.map(async (coupon) => {
      const validation = await validateCouponForCheckout(userId, coupon.code, subtotalPaise);

      return {
        code: coupon.code,
        valueLabel: couponValueLabel(coupon),
        minOrder: coupon.minOrderPaise != null ? formatPaise(coupon.minOrderPaise) : null,
        validUntil: formatValidUntil(coupon.endsAt),
        canApply: !("error" in validation),
        reason: "error" in validation ? validation.message : null,
        estimatedDiscount:
          "error" in validation ? null : formatPaise(validation.discountPaise),
      };
    }),
  );
}
