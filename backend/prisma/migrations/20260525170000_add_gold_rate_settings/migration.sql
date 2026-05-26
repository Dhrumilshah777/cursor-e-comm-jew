-- CreateTable
CREATE TABLE "gold_rate_settings" (
    "id" TEXT NOT NULL,
    "rate24ktRupeesPerGram" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gold_rate_settings_pkey" PRIMARY KEY ("id")
);

-- Default 24KT rate derived from previous 22KT ₹8,200/g (8200 / 0.916 ≈ 8952)
INSERT INTO "gold_rate_settings" ("id", "rate24ktRupeesPerGram", "updatedAt")
VALUES ('default', 8952.00, CURRENT_TIMESTAMP);
