-- Orders already at Razorpay "processing" should show as credited
UPDATE "orders"
SET
  "cancelRefundStatus" = 'CREDITED',
  "cancelRefundCreditedAt" = COALESCE("cancelRefundProcessingAt", "cancelledAt", "updatedAt"),
  "paymentStatus" = 'Refund credited'
WHERE "status" = 'CANCELLED'
  AND "cancelRefundStatus" = 'PROCESSING';
