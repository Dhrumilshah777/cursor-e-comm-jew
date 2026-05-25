-- AlterTable
ALTER TABLE "checkout_payments" ADD COLUMN     "itemsJson" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "stockCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing products with default stock of 1 so they remain purchasable.
UPDATE "products" SET "stockCount" = 1 WHERE "stockCount" = 0;
