import type { Coupon, CouponType } from "../generated/prisma/client.js";
import { formatPaise } from "../lib/format.js";
import { prisma } from "../lib/prisma.js";
import { couponValueLabel, normalizeCouponCode } from "./coupons.js";

export type AdminCouponInput = {
  code: string;
  type: CouponType | string;
  value: number;
  minOrderRupees?: number | null;
  maxDiscountRupees?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};

function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

function parseCouponType(type: string): CouponType {
  return type === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
}

function parseOptionalDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCouponData(input: AdminCouponInput) {
  const type = parseCouponType(String(input.type));
  const code = normalizeCouponCode(input.code);

  if (!code) {
    throw new Error("Coupon code is required");
  }

  let value = Number(input.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Coupon value must be greater than zero");
  }

  if (type === "PERCENTAGE") {
    if (value > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }
    value = Math.round(value);
  } else {
    value = rupeesToPaise(value);
  }

  const minOrderPaise =
    input.minOrderRupees != null && input.minOrderRupees > 0
      ? rupeesToPaise(Number(input.minOrderRupees))
      : null;

  const maxDiscountPaise =
    type === "PERCENTAGE" &&
    input.maxDiscountRupees != null &&
    input.maxDiscountRupees > 0
      ? rupeesToPaise(Number(input.maxDiscountRupees))
      : null;

  return {
    code,
    type,
    value,
    minOrderPaise,
    maxDiscountPaise,
    usageLimit:
      input.usageLimit != null && input.usageLimit > 0
        ? Math.round(Number(input.usageLimit))
        : null,
    usageLimitPerUser:
      input.usageLimitPerUser != null && input.usageLimitPerUser > 0
        ? Math.round(Number(input.usageLimitPerUser))
        : null,
    startsAt: parseOptionalDate(input.startsAt),
    endsAt: parseOptionalDate(input.endsAt),
    isActive: input.isActive ?? true,
  };
}

function toAdminCouponDto(coupon: Coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value:
      coupon.type === "PERCENTAGE"
        ? coupon.value
        : Number((coupon.value / 100).toFixed(2)),
    valueLabel: couponValueLabel(coupon),
    minOrderPaise: coupon.minOrderPaise,
    minOrder:
      coupon.minOrderPaise != null ? formatPaise(coupon.minOrderPaise) : null,
    maxDiscountPaise: coupon.maxDiscountPaise,
    maxDiscount:
      coupon.maxDiscountPaise != null ? formatPaise(coupon.maxDiscountPaise) : null,
    usageLimit: coupon.usageLimit,
    usageLimitPerUser: coupon.usageLimitPerUser,
    usedCount: coupon.usedCount,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    endsAt: coupon.endsAt?.toISOString() ?? null,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export async function listAdminCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  return coupons.map(toAdminCouponDto);
}

export async function getAdminCouponById(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  return coupon ? toAdminCouponDto(coupon) : null;
}

export async function createAdminCoupon(input: AdminCouponInput) {
  const data = buildCouponData(input);
  const coupon = await prisma.coupon.create({ data });
  return toAdminCouponDto(coupon);
}

export async function updateAdminCoupon(id: string, input: Partial<AdminCouponInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return null;

  const merged: AdminCouponInput = {
    code: input.code ?? existing.code,
    type: input.type ?? existing.type,
    value:
      input.value ??
      (existing.type === "PERCENTAGE"
        ? existing.value
        : Number((existing.value / 100).toFixed(2))),
    minOrderRupees:
      input.minOrderRupees !== undefined
        ? input.minOrderRupees
        : existing.minOrderPaise != null
          ? existing.minOrderPaise / 100
          : null,
    maxDiscountRupees:
      input.maxDiscountRupees !== undefined
        ? input.maxDiscountRupees
        : existing.maxDiscountPaise != null
          ? existing.maxDiscountPaise / 100
          : null,
    usageLimit: input.usageLimit !== undefined ? input.usageLimit : existing.usageLimit,
    usageLimitPerUser:
      input.usageLimitPerUser !== undefined
        ? input.usageLimitPerUser
        : existing.usageLimitPerUser,
    startsAt:
      input.startsAt !== undefined
        ? input.startsAt
        : existing.startsAt?.toISOString() ?? null,
    endsAt:
      input.endsAt !== undefined ? input.endsAt : existing.endsAt?.toISOString() ?? null,
    isActive: input.isActive ?? existing.isActive,
  };

  const data = buildCouponData(merged);
  const coupon = await prisma.coupon.update({ where: { id }, data });
  return toAdminCouponDto(coupon);
}

export async function deactivateAdminCoupon(id: string) {
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { isActive: false },
  });
  return toAdminCouponDto(coupon);
}
