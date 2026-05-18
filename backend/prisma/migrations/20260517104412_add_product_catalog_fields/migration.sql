-- CreateEnum
CREATE TYPE "MakingChargeKind" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gstPercent" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "makingChargeKind" "MakingChargeKind" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "makingChargeValue" INTEGER NOT NULL DEFAULT 10;
