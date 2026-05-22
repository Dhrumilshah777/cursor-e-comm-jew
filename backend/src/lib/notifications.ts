import { sendTransactionalMessage } from "./twilioSms.js";

const STORE_NAME = process.env.STORE_NAME?.trim() || "Dhrumil Jewellers";

function adminPhone(): string | null {
  const raw =
    process.env.ADMIN_ALERT_PHONE?.trim() ||
    process.env.ADMIN_PHONE?.trim() ||
    null;
  return raw;
}

function formatInrFromPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export async function notifyOrderConfirmed(input: {
  customerPhone: string;
  orderNumber: string;
  totalPaise: number;
}) {
  const body = `${STORE_NAME}: Order ${input.orderNumber} confirmed. Total ${formatInrFromPaise(input.totalPaise)}. Track in My Orders on our website. Thank you!`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyAdminOrderPlaced(input: {
  orderNumber: string;
  totalPaise: number;
  customerPhone: string;
  customerName?: string | null;
}) {
  const admin = adminPhone();
  if (!admin) {
    console.warn("[Notify] ADMIN_ALERT_PHONE not set — skip admin new-order alert");
    return;
  }
  const customerLabel = input.customerName?.trim() || input.customerPhone;
  const body = `${STORE_NAME} Admin: New order ${input.orderNumber} placed. Total ${formatInrFromPaise(input.totalPaise)}. Customer ${customerLabel} (${input.customerPhone}). Check Admin Orders.`;
  await sendTransactionalMessage(admin, body);
}

export async function notifyOrderCancelled(input: {
  customerPhone: string;
  orderNumber: string;
  refundAmount: string;
  refundStatus?: string;
}) {
  const status = input.refundStatus ?? "Refund initiated";
  const body = `${STORE_NAME}: Order ${input.orderNumber} has been cancelled. ${status} for ${input.refundAmount}. Credited to your original payment method in 5-7 business days.`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyAdminOrderCancelled(input: {
  orderNumber: string;
  customerPhone: string;
  refundAmount: string;
  refundStatus?: string;
}) {
  const admin = adminPhone();
  if (!admin) return;
  const status = input.refundStatus ?? "Refund initiated";
  const body = `${STORE_NAME} Admin: Order ${input.orderNumber} cancelled by customer ${input.customerPhone}. ${status} — ${input.refundAmount}. Check Admin Orders.`;
  await sendTransactionalMessage(admin, body);
}

export async function notifyOrderDelivered(input: {
  customerPhone: string;
  orderNumber: string;
}) {
  const body = `${STORE_NAME}: Your order ${input.orderNumber} has been delivered. Thank you for shopping with us!`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyAdminReturnRequested(input: {
  orderNumber: string;
  productName: string;
  customerPhone: string;
  reason: string;
}) {
  const admin = adminPhone();
  if (!admin) {
    console.warn("[Notify] ADMIN_ALERT_PHONE not set — skip admin return alert");
    return;
  }
  const body = `${STORE_NAME} Admin: New return request for ${input.orderNumber} (${input.productName}). Reason: ${input.reason}. Customer ${input.customerPhone}. Check Admin Returns.`;
  await sendTransactionalMessage(admin, body);
}

export async function notifyReturnRejected(input: {
  customerPhone: string;
  orderNumber: string;
}) {
  const body = `${STORE_NAME}: Your return request for order ${input.orderNumber} could not be approved. Contact Client Care for help.`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyReturnApproved(input: {
  customerPhone: string;
  orderNumber: string;
  pickupScheduledFor?: string | null;
}) {
  const pickupLine = input.pickupScheduledFor
    ? ` Pickup: ${input.pickupScheduledFor}.`
    : " Courier will contact you before pickup.";
  const body = `${STORE_NAME}: Return approved for order ${input.orderNumber}.${pickupLine} Keep item packed with invoice and certificate.`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyRefundProcessed(input: {
  customerPhone: string;
  orderNumber: string;
  amountPaise: number;
}) {
  const body = `${STORE_NAME}: Refund ${formatInrFromPaise(input.amountPaise)} for order ${input.orderNumber} has been processed to your original payment method (5-7 business days).`;
  await sendTransactionalMessage(input.customerPhone, body);
}

export async function notifyAdminRefundFailed(input: {
  orderNumber: string;
  returnRequestId: string;
  reason?: string;
}) {
  const admin = adminPhone();
  if (!admin) return;
  const body = `${STORE_NAME} Admin: Refund FAILED for return ${input.returnRequestId} (order ${input.orderNumber}).${input.reason ? ` ${input.reason}` : ""} Check Razorpay dashboard.`;
  await sendTransactionalMessage(admin, body);
}

export async function notifyRefundInitiated(input: {
  customerPhone: string;
  orderNumber: string;
  amountPaise: number;
}) {
  const body = `${STORE_NAME}: Refund of ${formatInrFromPaise(input.amountPaise)} initiated for order ${input.orderNumber}. You will receive it in 5-7 business days.`;
  await sendTransactionalMessage(input.customerPhone, body);
}
