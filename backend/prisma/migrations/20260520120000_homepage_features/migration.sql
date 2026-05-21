-- CreateEnum
CREATE TYPE "HomepageSection" AS ENUM ('NEW_ARRIVALS', 'TOP_STYLES', 'ELEGANCE_IN_MOTION');

-- CreateTable
CREATE TABLE "homepage_features" (
    "id" TEXT NOT NULL,
    "section" "HomepageSection" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "caption" TEXT,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homepage_features_section_sortOrder_idx" ON "homepage_features"("section", "sortOrder");

-- AddForeignKey
ALTER TABLE "homepage_features" ADD CONSTRAINT "homepage_features_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
