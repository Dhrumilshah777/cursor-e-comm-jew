import type { Address, Order, OrderItem } from "../generated/prisma/client.js";
import { generateInvoicePdf } from "../lib/invoice/generateInvoicePdf.js";
import { prisma } from "../lib/prisma.js";

const invoiceOrderInclude = {
  items: true,
  deliveryAddress: true,
};

export type InvoiceOrderRecord = Order & {
  items: OrderItem[];
  deliveryAddress: Address;
};

export async function getInvoiceOrderForUser(
  orderId: string,
  userId: string,
): Promise<InvoiceOrderRecord | null> {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: invoiceOrderInclude,
  });
}

export async function getInvoiceOrderById(
  orderId: string,
): Promise<InvoiceOrderRecord | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: invoiceOrderInclude,
  });
}

export async function buildInvoicePdfBuffer(order: InvoiceOrderRecord): Promise<Buffer> {
  return generateInvoicePdf(order);
}

export function invoicePdfFilename(orderNumber: string): string {
  return `invoice-${orderNumber}.pdf`;
}
