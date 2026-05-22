-- AlterTable
ALTER TABLE "orders" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelRefundPaise" INTEGER,
ADD COLUMN "cancelDeductionPaise" INTEGER,
ADD COLUMN "cancelRazorpayRefundId" TEXT,
ADD COLUMN "cancelRefundStatus" TEXT;
