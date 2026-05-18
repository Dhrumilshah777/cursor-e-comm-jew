-- AlterTable
ALTER TABLE "products" ALTER COLUMN "makingChargeValue" SET DATA TYPE DECIMAL(8,2) USING ("makingChargeValue"::decimal);
ALTER TABLE "products" ALTER COLUMN "makingChargeValue" SET DEFAULT 0.1;
