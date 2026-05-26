import {
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
} from "./emailTemplates/orderEmails.js";
import {
  buildOrderCancelledEmail,
  buildOrderDeliveredEmail,
  buildOrderShippedEmail,
  buildRefundInitiatedEmail,
  buildRefundProcessedEmail,
  buildReturnApprovedEmail,
  buildReturnRejectedEmail,
} from "./emailTemplates/transactionalEmails.js";
import { buildOrderEmailData } from "./orderEmailMapper.js";
import {
  adminAlertEmail,
  formatInrFromPaise,
} from "./resendEmail.js";
import {
  enqueueEmailNotification,
  enqueueSmsNotification,
} from "./notificationQueue.js";
import { generateInvoicePdf } from "./invoice/generateInvoicePdf.js";

const STORE_NAME = process.env.STORE_NAME?.trim() || "Dhrumil Jewellers";

function adminPhone(): string | null {
  const raw =
    process.env.ADMIN_ALERT_PHONE?.trim() ||
    process.env.ADMIN_PHONE?.trim() ||
    null;
  return raw;
}

type EmailMessage = {
  subject: string;
  html: string;
  text: string;
};

async function sendCustomerEmail(
  email: string | null | undefined,
  kind: string,
  message: EmailMessage,
  options?: { jobId?: string; attachment?: { filename: string; content: Buffer } },
): Promise<void> {
  if (!email?.trim()) return;
  await enqueueEmailNotification(
    {
      kind,
      to: email.trim().toLowerCase(),
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(options?.attachment
        ? {
            attachment: {
              filename: options.attachment.filename,
              contentBase64: options.attachment.content.toString("base64"),
            },
          }
        : {}),
    },
    options?.jobId ? { jobId: options.jobId } : undefined,
  );
}

type OrderPlacedNotificationInput = {
  order: Parameters<typeof buildOrderEmailData>[0];
  customerEmail: string;
  customerPhone: string;
  customerName?: string | null;
};

export async function notifyOrderPlaced(input: OrderPlacedNotificationInput) {
  const emailData = buildOrderEmailData(input.order, input.customerEmail);
  const confirmationEmail = buildOrderConfirmationEmail(emailData);

  let invoiceAttachment: { filename: string; content: Buffer } | undefined;
  try {
    const pdf = await generateInvoicePdf(input.order);
    invoiceAttachment = {
      filename: `invoice-${input.order.orderNumber}.pdf`,
      content: pdf,
    };
  } catch (error) {
    console.error(
      `[Notify] Invoice PDF failed for ${input.order.orderNumber}:`,
      error,
    );
  }

  await sendCustomerEmail(
    input.customerEmail,
    "order-confirmed",
    confirmationEmail,
    {
      jobId: `email-order-confirmed-${input.order.id}`,
      attachment: invoiceAttachment,
    },
  );

  const adminEmail = adminAlertEmail();
  if (adminEmail) {
    const adminOrderEmail = buildAdminNewOrderEmail({
      ...emailData,
      customerPhone: input.customerPhone,
    });
    await enqueueEmailNotification({
      kind: "admin-order-placed",
      to: adminEmail,
      subject: adminOrderEmail.subject,
      html: adminOrderEmail.html,
      text: adminOrderEmail.text,
    });
  } else {
    console.warn("[Notify] ADMIN_ALERT_EMAIL not set — skip admin new-order email");
  }

  if (input.customerPhone) {
    await notifyOrderConfirmed({
      customerPhone: input.customerPhone,
      orderNumber: input.order.orderNumber,
      totalPaise: input.order.totalPaise,
    });
  }

  await notifyAdminOrderPlaced({
    orderNumber: input.order.orderNumber,
    totalPaise: input.order.totalPaise,
    customerPhone: input.customerPhone,
    customerName: input.customerName ?? input.order.deliveryAddress.name,
  });
}

export async function notifyOrderConfirmed(input: {
  customerPhone: string;
  orderNumber: string;
  totalPaise: number;
}) {
  const body = `${STORE_NAME}: Order ${input.orderNumber} confirmed. Total ${formatInrFromPaise(input.totalPaise)}. Track in My Orders on our website. Thank you!`;
  await enqueueSmsNotification({
    kind: "order-confirmed",
    to: input.customerPhone,
    body,
  });
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
  await enqueueSmsNotification({
    kind: "admin-order-placed",
    to: admin,
    body,
  });
}

export async function notifyOrderShipped(input: {
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
  courier?: string | null;
  trackingNumber?: string | null;
  expectedDelivery?: string | null;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "order-shipped",
    buildOrderShippedEmail(input),
    { jobId: `email-order-shipped-${input.orderId}` },
  );
}

export async function notifyOrderCancelled(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
  refundAmount: string;
  refundStatus?: string;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "order-cancelled",
    buildOrderCancelledEmail(input),
    { jobId: `email-order-cancelled-${input.orderId}` },
  );

  const status = input.refundStatus ?? "Refund initiated";
  const body = `${STORE_NAME}: Order ${input.orderNumber} has been cancelled. ${status} for ${input.refundAmount}. Credited to your original payment method in 5-7 business days.`;
  await enqueueSmsNotification({
    kind: "order-cancelled",
    to: input.customerPhone,
    body,
  });
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
  await enqueueSmsNotification({
    kind: "admin-order-cancelled",
    to: admin,
    body,
  });
}

export async function notifyOrderDelivered(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "order-delivered",
    buildOrderDeliveredEmail(input),
    { jobId: `email-order-delivered-${input.orderId}` },
  );

  const body = `${STORE_NAME}: Your order ${input.orderNumber} has been delivered. Thank you for shopping with us!`;
  await enqueueSmsNotification({
    kind: "order-delivered",
    to: input.customerPhone,
    body,
  });
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
  await enqueueSmsNotification({
    kind: "admin-return-requested",
    to: admin,
    body,
  });
}

export async function notifyReturnRejected(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "return-rejected",
    buildReturnRejectedEmail(input),
    { jobId: `email-return-rejected-${input.orderId}` },
  );

  const body = `${STORE_NAME}: Your return request for order ${input.orderNumber} could not be approved. Contact Client Care for help.`;
  await enqueueSmsNotification({
    kind: "return-rejected",
    to: input.customerPhone,
    body,
  });
}

export async function notifyReturnApproved(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
  pickupScheduledFor?: string | null;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "return-approved",
    buildReturnApprovedEmail(input),
    { jobId: `email-return-approved-${input.orderId}` },
  );

  const pickupLine = input.pickupScheduledFor
    ? ` Pickup: ${input.pickupScheduledFor}.`
    : " Courier will contact you before pickup.";
  const body = `${STORE_NAME}: Return approved for order ${input.orderNumber}.${pickupLine} Keep item packed with invoice and certificate.`;
  await enqueueSmsNotification({
    kind: "return-approved",
    to: input.customerPhone,
    body,
  });
}

export async function notifyRefundProcessed(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
  amountPaise: number;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "refund-processed",
    buildRefundProcessedEmail(input),
    { jobId: `email-refund-processed-${input.orderId}-${input.amountPaise}` },
  );

  const body = `${STORE_NAME}: Refund ${formatInrFromPaise(input.amountPaise)} for order ${input.orderNumber} has been processed to your original payment method (5-7 business days).`;
  await enqueueSmsNotification({
    kind: "refund-processed",
    to: input.customerPhone,
    body,
  });
}

export async function notifyAdminRefundFailed(input: {
  orderNumber: string;
  returnRequestId: string;
  reason?: string;
}) {
  const admin = adminPhone();
  if (!admin) return;
  const body = `${STORE_NAME} Admin: Refund FAILED for return ${input.returnRequestId} (order ${input.orderNumber}).${input.reason ? ` ${input.reason}` : ""} Check Razorpay dashboard.`;
  await enqueueSmsNotification({
    kind: "admin-refund-failed",
    to: admin,
    body,
  });
}

export async function notifyRefundInitiated(input: {
  customerEmail?: string | null;
  customerPhone: string;
  customerName?: string | null;
  orderId: string;
  orderNumber: string;
  amountPaise: number;
}) {
  await sendCustomerEmail(
    input.customerEmail,
    "refund-initiated",
    buildRefundInitiatedEmail(input),
    { jobId: `email-refund-initiated-${input.orderId}-${input.amountPaise}` },
  );

  const body = `${STORE_NAME}: Refund of ${formatInrFromPaise(input.amountPaise)} initiated for order ${input.orderNumber}. You will receive it in 5-7 business days.`;
  await enqueueSmsNotification({
    kind: "refund-initiated",
    to: input.customerPhone,
    body,
  });
}

export async function notifyAdminCancellationRefundFailed(input: {
  orderNumber: string;
  refundAmount: string;
  reason?: string;
}) {
  const admin = adminPhone();
  if (!admin) return;
  const body = `${STORE_NAME} Admin: Cancellation refund FAILED for order ${input.orderNumber} (${input.refundAmount}).${input.reason ? ` ${input.reason}` : ""} Refund needs manual action in Razorpay.`;
  await enqueueSmsNotification({
    kind: "admin-cancel-refund-failed",
    to: admin,
    body,
  });
}
