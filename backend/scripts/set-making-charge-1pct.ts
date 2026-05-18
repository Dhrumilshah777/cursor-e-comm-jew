import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { calculatePriceBreakup, purityFromDb } from "../src/lib/pricing.js";

async function main() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const netWeightGrams = Number.parseFloat(product.weightGrams.toString());
    const breakup = calculatePriceBreakup({
      netWeightGrams,
      purity: purityFromDb(product.purity),
      makingCharge: { type: "percentage", value: 1 },
      gstPercent: product.gstPercent,
    });

    const pricePaise = Math.round(breakup.total * 100);

    await prisma.product.update({
      where: { id: product.id },
      data: {
        makingChargeKind: "PERCENTAGE",
        makingChargeValue: 1,
        pricePaise,
      },
    });
  }

  console.log(`Updated ${products.length} products to 1% making charge and recalculated prices.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
