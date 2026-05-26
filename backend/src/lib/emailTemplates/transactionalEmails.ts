import { formatInrFromPaise } from "../resendEmail.js";
import {
  STORE_NAME,
  ctaButton,
  emailShell,
  escapeHtml,
  orderAccountUrl,
} from "./layout.js";

type OrderRef = {
  orderId: string;
  orderNumber: string;
  customerName?: string | null;
};

export function buildOrderShippedEmail(input: OrderRef & {
  courier?: string | null;
  trackingNumber?: string | null;
  expectedDelivery?: string | null;
}) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";
  const courier = input.courier?.trim() || "Our courier partner";
  const tracking = input.trackingNumber?.trim() || "Available in your account shortly";
  const eta = input.expectedDelivery?.trim();

  const html = emailShell(
    `Order ${input.orderNumber} shipped`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Your order has shipped</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, great news — order <strong>${escapeHtml(input.orderNumber)}</strong> is on its way.
     </p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
       <tr><td style="padding:6px 0;color:#71717a;">Courier</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(courier)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Tracking / AWB</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(tracking)}</td></tr>
       ${eta ? `<tr><td style="padding:6px 0;color:#71717a;">Expected delivery</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(eta)}</td></tr>` : ""}
     </table>
     ${ctaButton(orderUrl, "Track order")}`,
  );

  const text = [
    `${STORE_NAME} — Order shipped`,
    "",
    `Hi ${name},`,
    `Order ${input.orderNumber} has shipped.`,
    `Courier: ${courier}`,
    `Tracking: ${tracking}`,
    eta ? `Expected delivery: ${eta}` : "",
    "",
    `Track: ${orderUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `Order ${input.orderNumber} shipped — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildOrderDeliveredEmail(input: OrderRef) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";

  const html = emailShell(
    `Order ${input.orderNumber} delivered`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Delivered</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, your order <strong>${escapeHtml(input.orderNumber)}</strong> has been delivered. We hope you love your new piece.
     </p>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       Need to return something? You can start a return from your account within 15 days of delivery.
     </p>
     ${ctaButton(orderUrl, "View order")}`,
  );

  const text = [
    `${STORE_NAME} — Order delivered`,
    "",
    `Hi ${name},`,
    `Your order ${input.orderNumber} has been delivered. Thank you for shopping with us!`,
    "",
    `View order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Order ${input.orderNumber} delivered — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildOrderCancelledEmail(input: OrderRef & {
  refundAmount: string;
  refundStatus?: string;
}) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";
  const status = input.refundStatus ?? "Refund initiated";

  const html = emailShell(
    `Order ${input.orderNumber} cancelled`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Order cancelled</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, your order <strong>${escapeHtml(input.orderNumber)}</strong> has been cancelled as requested.
     </p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
       <tr><td style="padding:6px 0;color:#71717a;">Refund status</td><td align="right" style="padding:6px 0;color:#18181b;">${escapeHtml(status)}</td></tr>
       <tr><td style="padding:6px 0;color:#71717a;">Refund amount</td><td align="right" style="padding:6px 0;color:#18181b;font-weight:600;">${escapeHtml(input.refundAmount)}</td></tr>
     </table>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       Refunds are credited to your original payment method within 5–7 business days once processed by the bank.
     </p>
     ${ctaButton(orderUrl, "View order")}`,
  );

  const text = [
    `${STORE_NAME} — Order cancelled`,
    "",
    `Hi ${name},`,
    `Order ${input.orderNumber} has been cancelled.`,
    `${status} for ${input.refundAmount}.`,
    "",
    `View order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Order ${input.orderNumber} cancelled — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildReturnApprovedEmail(input: OrderRef & {
  pickupScheduledFor?: string | null;
}) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";
  const pickupLine = input.pickupScheduledFor?.trim()
    ? `Reverse pickup is scheduled for ${input.pickupScheduledFor.trim()}.`
    : "Our courier partner will contact you before pickup.";

  const html = emailShell(
    `Return approved — ${input.orderNumber}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Return approved</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, your return request for order <strong>${escapeHtml(input.orderNumber)}</strong> has been approved.
     </p>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       ${escapeHtml(pickupLine)} Please keep the item packed with invoice and certificate.
     </p>
     ${ctaButton(orderUrl, "Track return")}`,
  );

  const text = [
    `${STORE_NAME} — Return approved`,
    "",
    `Hi ${name},`,
    `Return approved for order ${input.orderNumber}.`,
    pickupLine,
    "",
    `Track: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Return approved for order ${input.orderNumber} — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildReturnRejectedEmail(input: OrderRef) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";

  const html = emailShell(
    `Return update — ${input.orderNumber}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Return not approved</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, we could not approve the return request for order <strong>${escapeHtml(input.orderNumber)}</strong>.
     </p>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       If you have questions, please contact our client care team — we are happy to help.
     </p>
     ${ctaButton(orderUrl, "View order")}`,
  );

  const text = [
    `${STORE_NAME} — Return not approved`,
    "",
    `Hi ${name},`,
    `Your return request for order ${input.orderNumber} could not be approved.`,
    "Contact client care if you need help.",
    "",
    `View order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Return update for order ${input.orderNumber} — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildRefundInitiatedEmail(input: OrderRef & { amountPaise: number }) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";
  const amount = formatInrFromPaise(input.amountPaise);

  const html = emailShell(
    `Refund initiated — ${input.orderNumber}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Refund initiated</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, a refund of <strong>${escapeHtml(amount)}</strong> for order <strong>${escapeHtml(input.orderNumber)}</strong> has been initiated.
     </p>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       It typically appears in your account within 5–7 business days, depending on your bank.
     </p>
     ${ctaButton(orderUrl, "View order")}`,
  );

  const text = [
    `${STORE_NAME} — Refund initiated`,
    "",
    `Hi ${name},`,
    `Refund of ${amount} initiated for order ${input.orderNumber}.`,
    "You should receive it in 5–7 business days.",
    "",
    `View order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Refund initiated for order ${input.orderNumber} — ${STORE_NAME}`,
    html,
    text,
  };
}

export function buildRefundProcessedEmail(input: OrderRef & { amountPaise: number }) {
  const orderUrl = orderAccountUrl(input.orderId);
  const name = input.customerName?.trim() || "there";
  const amount = formatInrFromPaise(input.amountPaise);

  const html = emailShell(
    `Refund processed — ${input.orderNumber}`,
    `<h1 style="margin:0 0 8px;font-size:24px;font-weight:400;">Refund processed</h1>
     <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#52525b;">
       Hi ${escapeHtml(name)}, your refund of <strong>${escapeHtml(amount)}</strong> for order <strong>${escapeHtml(input.orderNumber)}</strong> has been processed to your original payment method.
     </p>
     <p style="margin:0 0 24px;font-size:13px;color:#52525b;">
       Depending on your bank, it may take a few more days to reflect in your statement.
     </p>
     ${ctaButton(orderUrl, "View order")}`,
  );

  const text = [
    `${STORE_NAME} — Refund processed`,
    "",
    `Hi ${name},`,
    `Refund of ${amount} for order ${input.orderNumber} has been processed.`,
    "",
    `View order: ${orderUrl}`,
  ].join("\n");

  return {
    subject: `Refund processed for order ${input.orderNumber} — ${STORE_NAME}`,
    html,
    text,
  };
}
