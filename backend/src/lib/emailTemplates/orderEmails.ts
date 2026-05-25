import { formatInrFromPaise, getStoreFrontendUrl } from "../resendEmail.js";

export type OrderEmailItem = {
  name: string;
  quantity: number;
  unitPricePaise: number;
  image: string;
  size: string | null;
};

export type OrderEmailData = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  placedAtLabel: string;
  totalPaise: number;
  goldValuePaise: number;
  makingChargePaise: number;
  gstPaise: number;
  shippingPaise: number;
  discountPaise: number;
  couponCode: string | null;
  paymentMethod: string;
  transactionId: string | null;
  items: OrderEmailItem[];
  deliveryAddress: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
};

const STORE_NAME = process.env.STORE_NAME?.trim() || "Dhrumil Jewellers";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailShell(title: string, bodyHtml: string): string {
  const storeUrl = getStoreFrontendUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#71717a;">${escapeHtml(STORE_NAME)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${bodyHtml}</td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;">
                <a href="${escapeHtml(storeUrl)}" style="color:#18181b;text-decoration:none;">${escapeHtml(storeUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">Thank you for shopping with us.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderItemsHtml(items: OrderEmailItem[]): string {
  return items
    .map((item) => {
      const lineTotal = formatInrFromPaise(item.unitPricePaise * item.quantity);
      const sizeLine = item.size ? `<br /><span style="color:#71717a;">Size ${escapeHtml(item.size)}</span>` : "";
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #f4f4f5;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="72" valign="top">
                <img src="${escapeHtml(item.image)}" alt="" width="64" height="64" style="display:block;object-fit:cover;background:#f4f4f5;" />
              </td>
              <td valign="top" style="padding-left:12px;">
                <p style="margin:0;font-size:14px;color:#18181b;">${escapeHtml(item.name)}${sizeLine}</p>
                <p style="margin:6px 0 0;font-size:12px;color:#71717a;">Qty ${item.quantity}</p>
              </td>
              <td valign="top" align="right" style="white-space:nowrap;font-size:14px;color:#18181b;">${lineTotal}</td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

function renderBreakdownHtml(data: OrderEmailData): string {
  const rows = [
    ["Gold value", data.goldValuePaise],
    ["Making charges", data.makingChargePaise],
    ["GST", data.gstPaise],
    ["Shipping", data.shippingPaise],
  ];

  if (data.discountPaise > 0) {
    rows.push([
      data.couponCode ? `Discount (${data.couponCode})` : "Discount",
      -data.discountPaise,
    ]);
  }

  return rows
    .map(
      ([label, paise]) => `<tr>
        <td style="padding:4px 0;font-size:13px;color:#52525b;">${escapeHtml(String(label))}</td>
        <td align="right" style="padding:4px 0;font-size:13px;color:#18181b;">${formatInrFromPaise(Math.abs(Number(paise)))}${Number(paise) < 0 ? " −" : ""}</td>
      </tr>`,
    )
    .join("");
}

export function buildOrderConfirmationEmail(data: OrderEmailData) {
  const orderUrl = `${getStoreFrontendUrl()}/account/my-orders/${data.orderId}`;
  const address = data.deliveryAddress;
  const addressLines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.phone,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br />");

  const html = emailShell(
    `Order ${data.orderNumber} confirmed`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;letter-spacing:0.04em;">Order confirmed</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(data.customerName)}, thank you for your order. We have received your payment and your order is now being processed.
     </p>
     <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;">Order number</p>
     <p style="margin:0 0 20px;font-size:18px;color:#18181b;">${escapeHtml(data.orderNumber)}</p>
     <p style="margin:0 0 20px;font-size:13px;color:#71717a;">Placed on ${escapeHtml(data.placedAtLabel)}</p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${renderItemsHtml(data.items)}</table>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
       ${renderBreakdownHtml(data)}
       <tr>
         <td style="padding-top:10px;font-size:14px;font-weight:600;color:#18181b;">Total paid</td>
         <td align="right" style="padding-top:10px;font-size:14px;font-weight:600;color:#18181b;">${formatInrFromPaise(data.totalPaise)}</td>
       </tr>
     </table>
     <p style="margin:24px 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;">Delivery address</p>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#18181b;">${escapeHtml(address.name)}<br />${addressLines}</p>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       Payment: ${escapeHtml(data.paymentMethod)}${data.transactionId ? ` · Ref ${escapeHtml(data.transactionId)}` : ""}
     </p>
     <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;">View order</a>`,
  );

  const text = [
    `${STORE_NAME} — Order confirmed`,
    "",
    `Hi ${data.customerName},`,
    `Your order ${data.orderNumber} is confirmed. Total ${formatInrFromPaise(data.totalPaise)}.`,
    "",
    "Items:",
    ...data.items.map(
      (item) =>
        `- ${item.name}${item.size ? ` (Size ${item.size})` : ""} × ${item.quantity} — ${formatInrFromPaise(item.unitPricePaise * item.quantity)}`,
    ),
    "",
    `Delivery: ${address.name}, ${address.line1}, ${address.city}, ${address.state} ${address.pincode}`,
    "",
    `Track your order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Order ${data.orderNumber} confirmed — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildAdminNewOrderEmail(
  data: OrderEmailData & { customerPhone: string },
) {
  const adminUrl = `${getStoreFrontendUrl().replace(/\/$/, "")}/admin/orders/${data.orderId}`;
  const itemSummary = data.items
    .map(
      (item) =>
        `${item.name}${item.size ? ` (${item.size})` : ""} × ${item.quantity}`,
    )
    .join(", ");

  const html = emailShell(
    `New order ${data.orderNumber}`,
    `<h1 style="margin:0 0 8px;font-size:22px;font-weight:400;">New order received</h1>
     <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525b;">
       Order <strong>${escapeHtml(data.orderNumber)}</strong> was placed by ${escapeHtml(data.customerName)} (${escapeHtml(data.customerPhone)}).
     </p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
       <tr><td style="padding:6px 0;color:#71717a;">Total</td><td align="right" style="padding:6px 0;color:#18181b;font-weight:600;">${formatInrFromPaise(data.totalPaise)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Customer email</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(data.customerEmail)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Items</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(itemSummary)}</td></tr>
     </table>
     <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;">Open in admin</a>`,
  );

  const text = [
    `${STORE_NAME} Admin — New order`,
    "",
    `Order: ${data.orderNumber}`,
    `Customer: ${data.customerName}`,
    `Phone: ${data.customerPhone}`,
    `Email: ${data.customerEmail}`,
    `Total: ${formatInrFromPaise(data.totalPaise)}`,
    `Items: ${itemSummary}`,
    "",
    `Admin: ${adminUrl}`,
  ].join("\n");

  return {
    subject: `New order ${data.orderNumber} — ${formatInrFromPaise(data.totalPaise)}`,
    html,
    text,
  };
}
