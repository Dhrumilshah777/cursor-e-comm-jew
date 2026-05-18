-- CreateTable
CREATE TABLE "checkout_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "addressJson" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "shopOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_payments_razorpayOrderId_key" ON "checkout_payments"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "checkout_payments_userId_idx" ON "checkout_payments"("userId");

-- AddForeignKey
ALTER TABLE "checkout_payments" ADD CONSTRAINT "checkout_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
