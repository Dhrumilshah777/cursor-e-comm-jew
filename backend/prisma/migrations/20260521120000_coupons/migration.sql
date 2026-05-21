-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrderPaise" INTEGER,
    "maxDiscountPaise" INTEGER,
    "usageLimit" INTEGER,
    "usageLimitPerUser" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "checkout_payments" ADD COLUMN "subtotalPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "checkout_payments" ADD COLUMN "discountPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "checkout_payments" ADD COLUMN "couponId" TEXT;
ALTER TABLE "checkout_payments" ADD COLUMN "couponCode" TEXT;

UPDATE "checkout_payments" SET "subtotalPaise" = "amountPaise" WHERE "subtotalPaise" = 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "discountPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "couponId" TEXT;
ALTER TABLE "orders" ADD COLUMN "couponCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- AddForeignKey
ALTER TABLE "checkout_payments" ADD CONSTRAINT "checkout_payments_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
