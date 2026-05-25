-- DropIndex
DROP INDEX "orders_status_idx";

-- DropIndex
DROP INDEX "orders_userId_idx";

-- CreateIndex
CREATE INDEX "checkout_payments_status_expiresAt_idx" ON "checkout_payments"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "orders_placedAt_idx" ON "orders"("placedAt");

-- CreateIndex
CREATE INDEX "orders_userId_placedAt_idx" ON "orders"("userId", "placedAt");

-- CreateIndex
CREATE INDEX "orders_status_placedAt_idx" ON "orders"("status", "placedAt");

-- CreateIndex
CREATE INDEX "orders_transactionId_idx" ON "orders"("transactionId");

-- CreateIndex
CREATE INDEX "orders_cancelRazorpayRefundId_idx" ON "orders"("cancelRazorpayRefundId");

-- CreateIndex
CREATE INDEX "otp_codes_expiresAt_idx" ON "otp_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "return_requests_submittedAt_idx" ON "return_requests"("submittedAt");

-- CreateIndex
CREATE INDEX "return_requests_razorpayRefundId_idx" ON "return_requests"("razorpayRefundId");
