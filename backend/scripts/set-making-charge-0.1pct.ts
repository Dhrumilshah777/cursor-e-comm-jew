import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { calculatePriceBreakup, purityFromDb } from "../src/lib/pricing.js";

const MAKING_CHARGE_PERCENT = 0.1;

async function main() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const netWeightGrams = Number.parseFloat(product.weightGrams.toString());
    const breakup = calculatePriceBreakup({
      netWeightGrams,
      purity: purityFromDb(product.purity),
      makingCharge: { type: "percentage", value: MAKING_CHARGE_PERCENT },
      gstPercent: product.gstPercent,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        makingChargeKind: "PERCENTAGE",
        makingChargeValue: MAKING_CHARGE_PERCENT,
        pricePaise: Math.round(breakup.total * 100),
      },
    });
  }

  console.log(
    `Updated ${products.length} products to ${MAKING_CHARGE_PERCENT}% making charge and recalculated prices.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
