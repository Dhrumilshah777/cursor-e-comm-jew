import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import type { GoldPurity, MetalType, OrderStatus } from "../src/generated/prisma/client.js";
import { seedCatalogProducts } from "./seedCatalog.js";
import { seedAdminUser } from "../src/services/adminAuth.js";

const SEED_PHONE = "+919876543210";
const SEED_ORDER_NUMBERS = ["DJ-24041", "DJ-23988", "DJ-23912"] as const;

function parseRupeeToPaise(value: string): number {
  const rupees = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return rupees * 100;
}

function parseDisplayDate(value: string): Date {
  if (value === "—" || value.startsWith("Pending") || value.startsWith("To be")) {
    return new Date();
  }
  const parsed = new Date(value.replace(/(\d+) (\w+) (\d+)/, "$2 $1, $3"));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

function toMetal(value: string): MetalType {
  const map: Record<string, MetalType> = {
    "Yellow Gold": "YELLOW_GOLD",
    "Rose Gold": "ROSE_GOLD",
    "White Gold": "WHITE_GOLD",
  };
  const metal = map[value];
  if (!metal) throw new Error(`Unknown metal: ${value}`);
  return metal;
}

function toPurity(value: string): GoldPurity {
  const normalized = value.toUpperCase().replace("KT", "KT_");
  const map: Record<string, GoldPurity> = {
    KT_14: "KT_14",
    KT_18: "KT_18",
    KT_22: "KT_22",
    "14KT": "KT_14",
    "18KT": "KT_18",
    "22KT": "KT_22",
  };
  const purity = map[normalized] ?? map[value.toUpperCase()];
  if (!purity) throw new Error(`Unknown purity: ${value}`);
  return purity;
}

function timelineStatus(label: string): OrderStatus {
  if (label === "Delivered") return "DELIVERED";
  if (label === "Out for Delivery") return "OUT_FOR_DELIVERY";
  if (label === "Shipped") return "SHIPPED";
  if (label === "Packed") return "PACKED";
  if (label === "Order Confirmed") return "CONFIRMED";
  if (label === "Cancelled") return "CANCELLED";
  return "PROCESSING";
}

const IMG_SOLITAIRE =
  "https://i.pinimg.com/736x/bb/94/5f/bb945fbfb6d5a5c16647ad1f97b03ac5.jpg";
const IMG_PEARL =
  "https://i.pinimg.com/736x/57/21/fc/5721fc3ccfc5381ff09c753bc11692d1.jpg";
const IMG_PAVE =
  "https://i.pinimg.com/736x/49/7f/69/497f699de95ec3c83a814eeb1be0ecee.jpg";

async function clearSeedData() {
  await prisma.order.deleteMany({
    where: { orderNumber: { in: [...SEED_ORDER_NUMBERS] } },
  });

  const user = await prisma.user.findUnique({ where: { phone: SEED_PHONE } });
  if (user) {
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }

  await prisma.product.deleteMany();
}

async function main() {
  console.log("Clearing previous seed data…");
  await clearSeedData();

  console.log("Seeding catalog products…");
  const productCount = await seedCatalogProducts();
  console.log(`  ${productCount} products`);

  console.log("Seeding demo user & address…");
  const user = await prisma.user.create({
    data: {
      id: "user_demo_dhrumil",
      phone: SEED_PHONE,
      name: "Dhrumil Patel",
      email: "dhrumil@example.com",
    },
  });

  const address = await prisma.address.create({
    data: {
      id: "addr_demo_home",
      userId: user.id,
      label: "Home",
      name: "Dhrumil Patel",
      line1: "123 Satellite Road",
      line2: "Satellite",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      phone: SEED_PHONE,
      isDefault: true,
    },
  });

  const orders = [
    {
      id: "ord-24041",
      orderNumber: "DJ-24041",
      status: "DELIVERED" as OrderStatus,
      placedAt: parseDisplayDate("8 May 2026"),
      totalPaise: parseRupeeToPaise("₹17,750"),
      goldValuePaise: parseRupeeToPaise("₹14,820"),
      makingChargePaise: parseRupeeToPaise("₹1,480"),
      gstPaise: parseRupeeToPaise("₹490"),
      shippingPaise: 0,
      paymentMethod: "UPI Payment",
      paymentStatus: "Paid Successfully",
      transactionId: "TXN8829104736",
      courier: "BlueDart",
      trackingNumber: "872827272",
      expectedDelivery: "12 May 2026",
      timeline: [
        { label: "Order Confirmed", date: "8 May 2026" },
        { label: "Packed", date: "9 May 2026" },
        { label: "Shipped", date: "10 May 2026" },
        { label: "Out for Delivery", date: "11 May 2026" },
        { label: "Delivered", date: "12 May 2026" },
      ],
      items: [
        {
          id: "oi-24041-1",
          productId: "ring-1",
          slug: "solitaire-ring",
          name: "Solitaire Ring",
          image: IMG_SOLITAIRE,
          metal: "Yellow Gold",
          purity: "22KT",
          size: "12",
          quantity: 1,
          unitPricePaise: parseRupeeToPaise("₹12,900"),
        },
        {
          id: "oi-24041-2",
          productId: "earring-1",
          slug: "pearl-drop-earrings",
          name: "Pearl Drop Earrings",
          image: IMG_PEARL,
          metal: "Rose Gold",
          purity: "18KT",
          size: null,
          quantity: 1,
          unitPricePaise: parseRupeeToPaise("₹4,850"),
        },
      ],
    },
    {
      id: "ord-23988",
      orderNumber: "DJ-23988",
      status: "SHIPPED" as OrderStatus,
      placedAt: parseDisplayDate("22 Apr 2026"),
      totalPaise: parseRupeeToPaise("₹8,450"),
      goldValuePaise: parseRupeeToPaise("₹6,950"),
      makingChargePaise: parseRupeeToPaise("₹695"),
      gstPaise: parseRupeeToPaise("₹230"),
      shippingPaise: parseRupeeToPaise("₹575"),
      paymentMethod: "Credit Card",
      paymentStatus: "Paid Successfully",
      transactionId: "TXN7721049281",
      courier: "BlueDart",
      trackingNumber: "872819904",
      expectedDelivery: "28 Apr 2026",
      timeline: [
        { label: "Order Confirmed", date: "22 Apr 2026" },
        { label: "Packed", date: "23 Apr 2026" },
        { label: "Shipped", date: "24 Apr 2026" },
        { label: "Out for Delivery", date: null },
        { label: "Delivered", date: null },
      ],
      items: [
        {
          id: "oi-23988-1",
          productId: "ring-2",
          slug: "celestial-band-ring",
          name: "Celestial Band Ring",
          image: IMG_PEARL,
          metal: "White Gold",
          purity: "18KT",
          size: "10",
          quantity: 1,
          unitPricePaise: parseRupeeToPaise("₹8,450"),
        },
      ],
    },
    {
      id: "ord-23912",
      orderNumber: "DJ-23912",
      status: "PROCESSING" as OrderStatus,
      placedAt: parseDisplayDate("5 Apr 2026"),
      totalPaise: parseRupeeToPaise("₹14,500"),
      goldValuePaise: parseRupeeToPaise("₹12,180"),
      makingChargePaise: parseRupeeToPaise("₹1,218"),
      gstPaise: parseRupeeToPaise("₹402"),
      shippingPaise: parseRupeeToPaise("₹700"),
      paymentMethod: "UPI Payment",
      paymentStatus: "Paid Successfully",
      transactionId: "TXN6610283745",
      courier: null,
      trackingNumber: null,
      expectedDelivery: null,
      timeline: [
        { label: "Order Confirmed", date: "5 Apr 2026" },
        { label: "Packed", date: null },
        { label: "Shipped", date: null },
        { label: "Out for Delivery", date: null },
        { label: "Delivered", date: null },
      ],
      items: [
        {
          id: "oi-23912-1",
          productId: "ring-7",
          slug: "pave-halo-ring",
          name: "Pavé Halo Ring",
          image: IMG_PAVE,
          metal: "Yellow Gold",
          purity: "22KT",
          size: "11",
          quantity: 1,
          unitPricePaise: parseRupeeToPaise("₹14,500"),
        },
      ],
    },
  ] as const;

  console.log("Seeding orders…");
  for (const order of orders) {
    await prisma.order.create({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: user.id,
        deliveryAddressId: address.id,
        status: order.status,
        placedAt: order.placedAt,
        totalPaise: order.totalPaise,
        goldValuePaise: order.goldValuePaise,
        makingChargePaise: order.makingChargePaise,
        gstPaise: order.gstPaise,
        shippingPaise: order.shippingPaise,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        expectedDelivery: order.expectedDelivery,
        items: {
          create: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            image: item.image,
            metal: toMetal(item.metal),
            purity: toPurity(item.purity),
            size: item.size,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
          })),
        },
        statusEvents: {
          create: order.timeline
            .filter((step) => step.date)
            .map((step) => ({
              status: timelineStatus(step.label),
              label: step.label,
              eventAt: parseDisplayDate(step.date!),
            })),
        },
      },
    });
  }

  console.log("Seeding admin user…");
  await seedAdminUser();
  console.log(`  Admin: ${process.env.ADMIN_EMAIL ?? "admin@jewelry.com"}`);

  console.log("Seed complete.");
  console.log(`  User: ${user.phone} (${user.name})`);
  console.log(`  Products: ${productCount}`);
  console.log(`  Orders: ${orders.length} (${orders.map((o) => o.id).join(", ")})`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
