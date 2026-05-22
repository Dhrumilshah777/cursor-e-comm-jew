-- AlterTable
ALTER TABLE "orders" ADD COLUMN "cancelRefundProcessingAt" TIMESTAMP(3),
ADD COLUMN "cancelRefundCreditedAt" TIMESTAMP(3);

-- Backfill legacy cancellation refund statuses
UPDATE "orders"
SET "cancelRefundStatus" = 'PROCESSING'
WHERE "cancelRefundStatus" = 'PROCESSED';

UPDATE "orders"
SET "paymentStatus" = 'Refund processing'
WHERE "cancelledAt" IS NOT NULL AND LOWER("paymentStatus") = 'refunded';

UPDATE "orders"
SET "paymentStatus" = 'Refund initiated'
WHERE "cancelledAt" IS NOT NULL
  AND "cancelRefundStatus" = 'INITIATED'
  AND LOWER("paymentStatus") NOT IN ('refund initiated', 'refund processing', 'refund credited', 'refund failed');

UPDATE "orders"
SET "cancelRefundProcessingAt" = COALESCE("cancelledAt", "updatedAt")
WHERE "cancelRefundStatus" = 'PROCESSING'
  AND "cancelRefundProcessingAt" IS NULL;
