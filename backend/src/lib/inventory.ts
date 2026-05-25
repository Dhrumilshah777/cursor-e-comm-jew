import type { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

/**
 * A single reservation line: which product, how many units.
 * Used both for stock decrements at checkout time and increments when
 * a checkout expires / is cancelled / a return is received.
 */
export type InventoryItem = {
  productId: string;
  quantity: number;
};

export type UnavailableItem = {
  productId: string;
  available: number;
  requested: number;
  name?: string;
};

export class InsufficientStockError extends Error {
  productId: string;
  requested: number;

  constructor(productId: string, requested: number) {
    super(
      `Insufficient stock for product ${productId} (requested ${requested}).`,
    );
    this.name = "InsufficientStockError";
    this.productId = productId;
    this.requested = requested;
  }
}

type TxOrClient = Prisma.TransactionClient | PrismaClient;

/**
 * Atomically decrement stock for each item. Uses `updateMany` with a
 * `stockCount: { gte: qty }` predicate so a race between two buyers can
 * only succeed once — the loser sees `count === 0` and we throw.
 *
 * Must be called inside a `prisma.$transaction` so partial decrements
 * roll back together.
 */
export async function reserveStock(
  client: TxOrClient,
  items: InventoryItem[],
): Promise<void> {
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) continue;

    const result = await client.product.updateMany({
      where: { id: item.productId, stockCount: { gte: item.quantity } },
      data: { stockCount: { decrement: item.quantity } },
    });

    if (result.count === 0) {
      throw new InsufficientStockError(item.productId, item.quantity);
    }
  }
}

/**
 * Restore stock — used when a reservation expires, an order is cancelled,
 * or a return is received back at the warehouse.
 *
 * Failures on a single item are swallowed to a console.error so the caller
 * isn't blocked by an admin-deleted product; we still restore the rest.
 */
export async function restoreStock(
  client: TxOrClient,
  items: InventoryItem[],
): Promise<void> {
  for (const item of items) {
    if (!item.productId || item.quantity <= 0) continue;

    try {
      await client.product.update({
        where: { id: item.productId },
        data: { stockCount: { increment: item.quantity } },
      });
    } catch (error) {
      console.error(
        `[inventory] Failed to restore stock for product ${item.productId}:`,
        error,
      );
    }
  }
}

/**
 * Pre-flight availability check. Cheaper than running a transaction and
 * lets us return a friendlier error to the customer ("X is sold out")
 * before talking to Razorpay.
 */
export async function checkAvailability(
  items: InventoryItem[],
): Promise<{ ok: boolean; unavailable: UnavailableItem[] }> {
  const ids = [...new Set(items.map((item) => item.productId))];
  if (ids.length === 0) {
    return { ok: true, unavailable: [] };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, stockCount: true, name: true },
  });

  const productById = new Map(products.map((product) => [product.id, product]));
  const unavailable: UnavailableItem[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);
    const available = product?.stockCount ?? 0;
    if (!product || available < item.quantity) {
      unavailable.push({
        productId: item.productId,
        available,
        requested: item.quantity,
        name: product?.name,
      });
    }
  }

  return { ok: unavailable.length === 0, unavailable };
}

export function serializeCheckoutItems(items: InventoryItem[]): string {
  return JSON.stringify(items.map((item) => ({
    productId: item.productId,
    quantity: Math.max(0, Math.floor(item.quantity)),
  })));
}

export function parseCheckoutItems(json: string | null | undefined): InventoryItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((raw): InventoryItem | null => {
        if (!raw || typeof raw !== "object") return null;
        const obj = raw as Record<string, unknown>;
        if (typeof obj.productId !== "string") return null;
        const qty = typeof obj.quantity === "number" ? obj.quantity : 0;
        if (qty <= 0) return null;
        return { productId: obj.productId, quantity: Math.floor(qty) };
      })
      .filter((item): item is InventoryItem => item !== null);
  } catch {
    return [];
  }
}
