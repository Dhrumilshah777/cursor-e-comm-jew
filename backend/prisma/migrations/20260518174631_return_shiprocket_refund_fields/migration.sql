-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'INITIATED', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "return_requests" ADD COLUMN     "razorpayRefundId" TEXT,
ADD COLUMN     "refundAmountPaise" INTEGER,
ADD COLUMN     "refundStatus" "RefundStatus",
ADD COLUMN     "reversePickupAt" TIMESTAMP(3),
ADD COLUMN     "shiprocketReturnOrderId" TEXT,
ADD COLUMN     "shiprocketReturnShipmentId" TEXT;
