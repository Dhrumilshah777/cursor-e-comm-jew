import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const totalProducts = await prisma.product.count();
const ringsProducts = await prisma.product.count({ where: { category: "rings" } });
const solitaire = await prisma.product.findUnique({
  where: { slug: "solitaire-ring" },
  select: {
    slug: true,
    name: true,
    pricePaise: true,
    category: true,
    metal: true,
    purity: true,
    weightGrams: true,
    isActive: true,
  },
});

console.log(
  JSON.stringify(
    {
      database: "jewellery_store",
      totalProducts,
      ringsProducts,
      orders: await prisma.order.count(),
      users: await prisma.user.count(),
      solitaireInDb: solitaire
        ? {
            ...solitaire,
            priceInRupees: `₹${(solitaire.pricePaise / 100).toLocaleString("en-IN")}`,
            weightGrams: solitaire.weightGrams.toString(),
          }
        : null,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
