"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { TimelineStep } from "@/data/accountOrders";
import { getOrderDetailPath } from "@/data/accountOrders";
import {
  getCustomerNotifications,
  getReturnTimelineForStatus,
  getStatusLabel,
  type CustomerNotificationPreview,
} from "@/data/returnRequest";
import ReturnAssistance from "@/components/account/ReturnAssistance";
import ReturnEligibilityRules from "@/components/account/ReturnEligibilityRules";
import {
  getReturnRequestByOrderId,
  type StoredReturnRequest,
} from "@/lib/returnStorage";

function ReturnStatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative mt-6 space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isRejected = step.id === "return-rejected";
        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[7px] top-4 h-[calc(100%-4px)] w-px ${
                  step.completed
                    ? isRejected
                      ? "bg-red-300"
                      : "bg-emerald-400"
                    : "bg-zinc-200"
                }`}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                isRejected
                  ? "border-red-600 bg-red-600"
                  : step.completed
                    ? "border-emerald-600 bg-emerald-600"
                    : step.current
                      ? "border-emerald-600 bg-white"
                      : "border-zinc-200 bg-white"
              }`}
              aria-hidden="true"
            >
              {step.completed && !isRejected ? (
                <span className="block h-1.5 w-1.5 rounded-full bg-white" />
              ) : step.current && !isRejected ? (
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-600" />
              ) : isRejected ? (
                <span className="block h-1.5 w-1.5 rounded-full bg-white" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-light uppercase tracking-[0.12em] ${
                  isRejected ? "text-red-800" : "text-zinc-900"
                }`}
              >
                {step.label}
              </p>
              {step.date ? (
                <p className="mt-1 text-[11px] font-light text-zinc-900">{step.date}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NotificationPreview({
  notifications,
}: {
  notifications: CustomerNotificationPreview;
}) {
  return (
    <div className="mt-6 space-y-3 border border-zinc-100 bg-white p-5">
      <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-zinc-500">
        Customer updates sent via
      </p>
      <div className="space-y-3 text-xs font-light leading-relaxed text-zinc-700">
        <div>
          <p className="mb-1 uppercase tracking-[0.14em] text-zinc-500">WhatsApp</p>
          <p>{notifications.whatsapp}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-[0.14em] text-zinc-500">SMS</p>
          <p>{notifications.sms}</p>
        </div>
        <div>
          <p className="mb-1 uppercase tracking-[0.14em] text-zinc-500">Email</p>
          <p className="whitespace-pre-line">{notifications.email}</p>
        </div>
      </div>
    </div>
  );
}

type ReturnTrackingViewProps = {
  orderId: string;
  whatsappHref: string;
};

export default function ReturnTrackingView({
  orderId,
  whatsappHref,
}: ReturnTrackingViewProps) {
  const [request, setRequest] = useState<StoredReturnRequest | null>(null);

  useEffect(() => {
    setRequest(getReturnRequestByOrderId(orderId) ?? null);
  }, [orderId]);

  useEffect(() => {
    const refresh = () => setRequest(getReturnRequestByOrderId(orderId) ?? null);
    window.addEventListener("storage", refresh);
    window.addEventListener("return-request-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("return-request-updated", refresh);
    };
  }, [orderId]);

  if (!request) return null;

  const timeline = getReturnTimelineForStatus(
    request.status,
    request.submittedAt,
    request.pickupScheduledFor,
  );
  const notifications = getCustomerNotifications(
    request.status,
    request.pickupScheduledFor,
  );
  const isRejected = request.status === "rejected";
  const isApproved =
    request.status === "approved" || request.status === "pickup_scheduled";

  return (
    <div className="mt-8 space-y-8">
      <div
        className={`border px-6 py-10 text-center sm:px-10 sm:py-12 ${
          isRejected
            ? "border-red-100 bg-red-50/40"
            : isApproved
              ? "border-emerald-100 bg-emerald-50/30"
              : "border-zinc-100 bg-zinc-50/40"
        }`}
      >
        <p
          className={`text-[10px] font-normal uppercase tracking-[0.28em] ${
            isRejected ? "text-red-700" : isApproved ? "text-emerald-700" : "text-zinc-500"
          }`}
        >
          {isRejected ? "Update" : isApproved ? "Approved" : "Submitted"}
        </p>
        <h2 className="mt-3 text-xl font-light uppercase tracking-[0.1em] text-zinc-950 sm:text-2xl">
          {isRejected
            ? "Return Request Not Approved"
            : isApproved
              ? "Return Request Approved"
              : "Return Request Submitted"}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-zinc-600">
          {isRejected
            ? "Your return request could not be approved as the item does not meet return eligibility criteria. Our Client Care team is happy to assist you."
            : isApproved
              ? notifications?.whatsapp ?? "Your return has been approved."
              : "Our team will review your request within 24 hours. Jewellery returns are manually reviewed — we do not auto-approve."}
        </p>
      </div>

      {notifications ? <NotificationPreview notifications={notifications} /> : null}

      <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900">
            Track return status
          </h3>
          <span className="text-[10px] font-light uppercase tracking-[0.16em] text-zinc-500">
            {getStatusLabel(request.status)}
          </span>
        </div>
        <ReturnStatusTimeline steps={timeline} />
      </section>

      <section className="border border-zinc-100 px-5 py-6 sm:px-8">
        <h3 className="text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900">
          Your return details
        </h3>
        <dl className="mt-4 space-y-2 text-sm font-light">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Order ID</dt>
            <dd className="text-zinc-900">{request.orderNumber}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Product</dt>
            <dd className="text-right text-zinc-900">{request.product.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Reason</dt>
            <dd className="text-right text-zinc-900">{request.reason}</dd>
          </div>
          {request.customerNotes ? (
            <div>
              <dt className="text-zinc-500">Notes</dt>
              <dd className="mt-1 text-zinc-800">{request.customerNotes}</dd>
            </div>
          ) : null}
        </dl>
        {request.productImageUrls.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {request.productImageUrls.map((url, i) => (
              <li key={`p-${i}`} className="relative h-16 w-16 overflow-hidden bg-zinc-100">
                <Image src={url} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <ReturnEligibilityRules compact />

      <ReturnAssistance whatsappHref={whatsappHref} orderNumber={request.orderNumber} />

      <div className="flex flex-wrap gap-3">
        <Link
          href={getOrderDetailPath(orderId)}
          className="cursor-pointer border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800"
        >
          Back to order
        </Link>
        <Link
          href="/account/my-orders"
          className="cursor-pointer border border-zinc-300 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
        >
          All orders
        </Link>
      </div>
    </div>
  );
}
