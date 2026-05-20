-- AlterTable
ALTER TABLE "orders" ADD COLUMN "pickupScheduledAt" TIMESTAMP(3),
ADD COLUMN "pickupDateLabel" TEXT,
ADD COLUMN "pickupTimeLabel" TEXT,
ADD COLUMN "shiprocketFulfillmentLog" JSONB;
