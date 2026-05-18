import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { calculatePriceBreakup, purityFromDb } from "../src/lib/pricing.js";

async function main() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    const netWeightGrams = Number.parseFloat(product.weightGrams.toString());
    const makingCharge =
      product.makingChargeKind === "PERCENTAGE"
        ? {
            type: "percentage" as const,
            value: Number.parseFloat(product.makingChargeValue.toString()),
          }
        : {
            type: "fixed" as const,
            value: Number.parseFloat(product.makingChargeValue.toString()),
          };

    const breakup = calculatePriceBreakup({
      netWeightGrams,
      purity: purityFromDb(product.purity),
      makingCharge,
      gstPercent: product.gstPercent,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { pricePaise: Math.round(breakup.total * 100) },
    });
  }

  console.log(`Recalculated prices for ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
