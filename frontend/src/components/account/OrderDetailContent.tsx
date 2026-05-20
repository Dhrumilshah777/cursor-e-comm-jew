import Image from "next/image";
import Link from "next/link";
import {
  getOrderStatusClass,
  type AccountOrder,
  type TimelineStep,
} from "@/data/accountOrders";
import { getReturnRequestPath } from "@/data/returnRequest";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900 sm:text-xs">
      {children}
    </h3>
  );
}

function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative mt-6 space-y-0">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className={`absolute left-[7px] top-4 h-[calc(100%-4px)] w-px ${
                  step.completed ? "bg-emerald-400" : "bg-zinc-200"
                }`}
                aria-hidden="true"
              />
            ) : null}
            <span
              className={`relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                step.completed
                  ? "border-emerald-600 bg-emerald-600"
                  : step.current
                    ? "border-emerald-600 bg-white"
                    : "border-zinc-200 bg-white"
              }`}
              aria-hidden="true"
            >
              {step.completed ? (
                <span className="block h-1.5 w-1.5 rounded-full bg-white" />
              ) : step.current ? (
                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-600" />
              ) : null}
            </span>
            <div className="min-w-0 flex-1 pt-0">
              <p className="text-xs font-light uppercase tracking-[0.12em] text-zinc-900">
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

function PriceRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className={`text-sm font-light ${bold ? "text-zinc-900" : "text-zinc-600"}`}>
        {label}
      </dt>
      <dd className={`text-sm ${bold ? "font-normal text-zinc-900" : "font-light text-zinc-900"}`}>
        {value}
      </dd>
    </div>
  );
}

type OrderDetailContentProps = {
  order: AccountOrder;
  whatsappHref: string;
};

export default function OrderDetailContent({
  order,
  whatsappHref,
}: OrderDetailContentProps) {
  const whatsappMessage = encodeURIComponent(
    `Hi, I need help with my order ${order.orderNumber}.`,
  );
  const whatsappOrderHref = `${whatsappHref}?text=${whatsappMessage}`;

  return (
    <div className="mt-8 space-y-8">
      <Link
        href="/account/my-orders"
        className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 transition hover:text-zinc-900"
      >
        <span aria-hidden="true">←</span>
        All orders
      </Link>

      <section className="border border-zinc-100">
        <ul className="divide-y divide-zinc-100 bg-white">
          {order.items.map((item) => (
            <li key={item.slug} className="flex gap-4 px-5 py-5 sm:gap-6 sm:px-8 sm:py-6">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden bg-zinc-100 sm:h-28 sm:w-28"
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900 transition hover:text-zinc-600 sm:text-[13px]"
                >
                  {item.name}
                </Link>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-light text-zinc-600 sm:grid-cols-3">
                  <div>
                    <dt className="uppercase tracking-[0.12em] text-zinc-400">Finish</dt>
                    <dd className="mt-0.5 text-zinc-800">{item.metal}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-[0.12em] text-zinc-400">Purity</dt>
                    <dd className="mt-0.5 text-zinc-800">{item.purity}</dd>
                  </div>
                  {item.size ? (
                    <div>
                      <dt className="uppercase tracking-[0.12em] text-zinc-400">Size</dt>
                      <dd className="mt-0.5 text-zinc-800">{item.size}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="uppercase tracking-[0.12em] text-zinc-400">Qty</dt>
                    <dd className="mt-0.5 text-zinc-800">{item.quantity}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="uppercase tracking-[0.12em] text-zinc-400">Price</dt>
                    <dd className="mt-0.5 text-sm text-zinc-900">{item.price}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-zinc-100 bg-zinc-50/30 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-500">
                Order
              </p>
              <p className="mt-1 text-lg font-light uppercase tracking-[0.1em] text-zinc-950 sm:text-xl">
                #{order.orderNumber}
              </p>
              <p className="mt-2 text-sm font-light text-zinc-600">
                Placed on {order.placedOn}
              </p>
            </div>
            <span
              className={`border px-3 py-1.5 text-[10px] font-normal uppercase tracking-[0.18em] ${getOrderStatusClass(order.status)}`}
            >
              {order.status}
            </span>
          </div>
          <p className="mt-6 text-2xl font-light text-zinc-950">{order.total}</p>
        </div>
      </section>

      <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
        <SectionTitle>Order status</SectionTitle>
        <OrderTimeline steps={order.timeline} />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
          <SectionTitle>Delivery address</SectionTitle>
          <address className="mt-4 space-y-1 text-sm font-light not-italic leading-relaxed text-zinc-700">
            <p className="text-zinc-900">{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.line1}</p>
            <p>
              {order.deliveryAddress.line2}, {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.state}
            </p>
            <p>{order.deliveryAddress.pincode}</p>
            <p className="pt-2 text-zinc-900">{order.deliveryAddress.phone}</p>
          </address>
        </section>

        <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
          <SectionTitle>Payment information</SectionTitle>
          <dl className="mt-4 space-y-3 text-sm font-light text-zinc-700">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Method
              </dt>
              <dd className="mt-1 text-zinc-900">{order.payment.method}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Status
              </dt>
              <dd className="mt-1 text-emerald-800">{order.payment.status}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Transaction ID
              </dt>
              <dd className="mt-1 font-mono text-xs text-zinc-900">
                {order.payment.transactionId}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
        <SectionTitle>Price breakdown</SectionTitle>
        <dl className="mt-4 divide-y divide-zinc-100">
          <PriceRow label="Material value" value={order.priceBreakdown.goldValue} />
          <PriceRow label="Making charges" value={order.priceBreakdown.makingCharges} />
          <PriceRow label="GST" value={order.priceBreakdown.gst} />
          <PriceRow label="Shipping" value={order.priceBreakdown.shipping} />
          <div className="border-t border-zinc-200 pt-2">
            <PriceRow label="Total" value={order.priceBreakdown.total} bold />
          </div>
        </dl>
      </section>

      <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
        <SectionTitle>Shipping information</SectionTitle>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              Courier partner
            </dt>
            <dd className="mt-1 text-sm font-light text-zinc-900">{order.shipping.courier}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              Tracking number
            </dt>
            <dd className="mt-1 text-sm font-light text-zinc-900">
              {order.shipping.trackingNumber.startsWith("Pending") ? (
                order.shipping.trackingNumber
              ) : (
                <>AWB: {order.shipping.trackingNumber}</>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              Expected delivery
            </dt>
            <dd className="mt-1 text-sm font-light text-zinc-900">
              {order.shipping.expectedDelivery}
            </dd>
          </div>
        </dl>
      </section>

      {order.returnRequest ? (
        <section className="border border-emerald-100 bg-emerald-50/30 px-5 py-6 sm:px-8 sm:py-8">
          <SectionTitle>Return request</SectionTitle>
          <p className="mt-2 text-sm font-light text-zinc-800">
            {order.returnRequest.productName} —{" "}
            <span className="uppercase tracking-[0.12em]">
              {order.returnRequest.statusLabel}
            </span>
          </p>
          {order.returnRequest.pickupScheduledFor ? (
            <p className="mt-4 text-sm font-light text-zinc-700">
              Shiprocket will pick up your return on{" "}
              <strong className="font-normal text-zinc-900">
                {order.returnRequest.pickupScheduledFor}
              </strong>
              . Keep the item packed with invoice and certificate; the courier may call
              before arrival.
            </p>
          ) : order.returnRequest.status === "under_review" ? (
            <p className="mt-4 text-sm font-light text-zinc-600">
              We are reviewing your request. Pickup details will appear here once
              approved.
            </p>
          ) : order.returnRequest.status === "pickup_scheduled" &&
            !order.returnRequest.refundStatus ? (
            <p className="mt-4 text-sm font-light text-zinc-600">
              Refund will be processed after we receive and inspect your item at our
              warehouse.
            </p>
          ) : null}
          {order.returnRequest.refundStatus === "INITIATED" ||
          order.returnRequest.refundStatus === "PROCESSED" ? (
            <p className="mt-3 text-xs font-light text-emerald-900">
              Refund{" "}
              {order.returnRequest.refundStatus === "PROCESSED"
                ? "completed"
                : "initiated"}{" "}
              to your original payment method (typically 5–7 business days).
            </p>
          ) : null}
          <Link
            href={getReturnRequestPath(order.id)}
            className="mt-5 inline-block text-[10px] font-light uppercase tracking-[0.16em] text-zinc-900 underline"
          >
            View return details
          </Link>
        </section>
      ) : order.returnEligible ? (
        <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
          <SectionTitle>Return / exchange</SectionTitle>
          <p className="mt-3 text-sm font-light text-zinc-600">
            This order is eligible for return or exchange within 15 days of delivery.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={getReturnRequestPath(order.id)}
              className="inline-flex cursor-pointer border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:border-zinc-800 hover:bg-zinc-800"
            >
              Request return
            </Link>
            <button
              type="button"
              className="cursor-pointer border border-zinc-300 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
            >
              Exchange item
            </button>
          </div>
        </section>
      ) : null}

      <section className="border border-zinc-100 bg-[#faf8f5] px-5 py-8 sm:px-8">
        <p className="text-sm font-light text-zinc-700">
          Need help with this order?
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={whatsappOrderHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-2 border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
          >
            <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
            WhatsApp support
          </a>
          <Link
            href="/account/client-care"
            className="inline-flex cursor-pointer items-center border border-zinc-300 bg-white px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
          >
            Contact client care
          </Link>
        </div>
      </section>
    </div>
  );
}
