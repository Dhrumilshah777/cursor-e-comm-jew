import PDFDocument from "pdfkit";
import type { Address, Order, OrderItem } from "../../generated/prisma/client.js";
import { formatDisplayDate } from "../format.js";
import {
  getInvoiceSellerConfig,
  splitGstPaise,
  type GstSplit,
} from "../invoiceConfig.js";
import { formatInrFromPaise } from "../resendEmail.js";

export type InvoiceOrder = Order & {
  items: OrderItem[];
  deliveryAddress: Address;
};

function formatInrPlain(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function drawRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  cols: [string, string, string, string, string],
  bold = false,
): number {
  const x = [50, 230, 290, 350, 470];
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
  cols.forEach((text, index) => {
    doc.text(text, x[index], y, {
      width: index === 0 ? 170 : 70,
      align: index >= 3 ? "right" : "left",
    });
  });
  return y + 16;
}

function renderTaxRows(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  gst: GstSplit,
): number {
  if (gst.mode === "intra") {
    y = drawRow(doc, y, ["", "", "CGST @ 1.5%", "", formatInrPlain(gst.cgstPaise)]);
    y = drawRow(doc, y, ["", "", "SGST @ 1.5%", "", formatInrPlain(gst.sgstPaise)]);
  } else {
    y = drawRow(doc, y, ["", "", "IGST @ 3%", "", formatInrPlain(gst.igstPaise)]);
  }
  return y;
}

export async function generateInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  const seller = getInvoiceSellerConfig();
  const gst = splitGstPaise(order.gstPaise, order.deliveryAddress.state);
  const taxablePaise = Math.max(
    0,
    order.goldValuePaise + order.makingChargePaise - order.discountPaise,
  );
  const address = order.deliveryAddress;
  const customerAddress = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.phone,
  ]
    .filter(Boolean)
    .join("\n");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text("TAX INVOICE", { align: "center" });
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(9).fillColor("#555555").text(seller.businessName, {
      align: "center",
    });
    doc.fillColor("#000000");

    let y = 90;
    doc.font("Helvetica-Bold").fontSize(10).text("Sold by", 50, y);
    doc.font("Helvetica").fontSize(9).text(seller.businessName, 50, y + 14, { width: 240 });
    doc.text(seller.address, 50, y + 28, { width: 240 });
    doc.text(`GSTIN: ${seller.gstin}`, 50, y + 68);
    doc.text(`State: ${seller.registeredState}`, 50, y + 82);

    doc.font("Helvetica-Bold").fontSize(10).text("Invoice details", 320, y);
    doc.font("Helvetica").fontSize(9);
    doc.text(`Invoice No: ${order.orderNumber}`, 320, y + 14);
    doc.text(`Order No: ${order.orderNumber}`, 320, y + 28);
    doc.text(`Invoice Date: ${formatDisplayDate(order.placedAt)}`, 320, y + 42);
    doc.text(`Place of supply: ${address.state}`, 320, y + 56);
    doc.text(
      `Supply type: ${gst.mode === "intra" ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}`,
      320,
      y + 70,
      { width: 230 },
    );

    y += 110;
    doc.font("Helvetica-Bold").fontSize(10).text("Bill to", 50, y);
    doc.font("Helvetica").fontSize(9);
    doc.text(address.name, 50, y + 14, { width: 240 });
    doc.text(customerAddress, 50, y + 28, { width: 240 });

    y += 95;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 8;
    y = drawRow(doc, y, ["Item", "HSN", "Qty", "Taxable", "Amount"], true);
    doc.moveTo(50, y - 4).lineTo(545, y - 4).stroke();

    for (const item of order.items) {
      const lineTaxable = item.unitPricePaise * item.quantity;
      const itemLabel = item.size
        ? `${item.name} (${item.purity}, Size ${item.size})`
        : `${item.name} (${item.purity})`;
      y = drawRow(doc, y, [
        itemLabel,
        "7113",
        String(item.quantity),
        formatInrPlain(lineTaxable),
        formatInrPlain(lineTaxable),
      ]);
    }

    y += 6;
    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    y = drawRow(doc, y, ["", "", "Gold value", "", formatInrPlain(order.goldValuePaise)]);
    y = drawRow(doc, y, ["", "", "Making charges", "", formatInrPlain(order.makingChargePaise)]);

    if (order.discountPaise > 0) {
      y = drawRow(doc, y, [
        "",
        "",
        order.couponCode ? `Discount (${order.couponCode})` : "Discount",
        "",
        `-${formatInrPlain(order.discountPaise)}`,
      ]);
    }

    y = drawRow(doc, y, ["", "", "Taxable value", "", formatInrPlain(taxablePaise)]);
    y = renderTaxRows(doc, y, gst);
    y = drawRow(doc, y, ["", "", "Shipping", "", formatInrPlain(order.shippingPaise)]);
    y += 4;
    doc.moveTo(350, y).lineTo(545, y).stroke();
    y += 8;
    y = drawRow(doc, y, ["", "", "Grand total", "", formatInrPlain(order.totalPaise)], true);

    y += 20;
    doc.font("Helvetica").fontSize(9);
    doc.text(`Payment: ${order.paymentMethod}`, 50, y);
    if (order.transactionId) {
      doc.text(`Transaction ID: ${order.transactionId}`, 50, y + 14);
    }
    doc.text(`Total GST: ${formatInrFromPaise(order.gstPaise)}`, 50, y + 28);

    y += 55;
    doc.font("Helvetica").fontSize(8).fillColor("#666666");
    doc.text(
      "This is a computer-generated tax invoice. Amount in words is not required for electronic invoices under Rule 46.",
      50,
      y,
      { width: 495 },
    );

    if (seller.gstin === "24AAAAA0000A1Z5") {
      doc.text(
        "Note: Placeholder GSTIN in use — replace STORE_GSTIN before production.",
        50,
        y + 28,
        { width: 495 },
      );
    }

    doc.end();
  });
}
