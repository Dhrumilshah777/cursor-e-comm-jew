"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  createRazorpayCheckoutOrder,
  verifyRazorpayPayment,
  type CheckoutAddress,
} from "@/lib/checkoutApi";
import { getCustomerToken } from "@/lib/customerAuth";

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const { cart, loading, refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace("/login?redirect=%2Fcheckout");
    }
  }, [router]);

  const getAddress = (): CheckoutAddress => ({
    name,
    line1,
    line2: line2 || undefined,
    city,
    state,
    pincode,
    phone,
    saveAddress,
  });

  const handlePay = async (event: FormEvent) => {
    event.preventDefault();
    if (!cart || cart.items.length === 0 || !razorpayReady || !window.Razorpay) {
      if (!razorpayReady) {
        setError("Payment gateway is still loading. Please wait a moment.");
      }
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const paymentOrder = await createRazorpayCheckoutOrder(getAddress());

      const rzp = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Wholesale Jewelry",
        description: "Jewelry order payment",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name,
          contact: phone.length === 10 ? `+91${phone}` : phone,
        },
        theme: { color: "#18181b" },
        handler: async (response) => {
          try {
            const order = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await refreshCart();
            router.replace(`/account/my-orders/${order.id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        setError(response.error?.description ?? "Payment failed");
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        router.replace("/login?redirect=%2Fcheckout");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading checkout…</p>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm font-light text-zinc-600">Your bag is empty.</p>
        <Link
          href="/collections"
          className="mt-6 inline-block border border-zinc-900 px-8 py-3 text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const totalPaise = cart.subtotalPaise;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setRazorpayReady(true)}
      />

      <form onSubmit={handlePay} className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900">
              Delivery address
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  Full name
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  Address line 1
                </span>
                <input
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  Address line 2 (optional)
                </span>
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  City
                </span>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  State
                </span>
                <input
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  Pincode
                </span>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-normal uppercase tracking-[0.18em] text-zinc-500">
                  Phone
                </span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="mt-1 w-full border border-zinc-300 px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none"
                />
              </label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-light text-zinc-600">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 border-zinc-300"
              />
              Save this address for next time
            </label>
          </section>

          <section>
            <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900">
              Payment
            </h2>
            <p className="mt-3 text-sm font-light text-zinc-600">
              Pay securely with Razorpay — UPI, cards, netbanking, and wallets.
            </p>
          </section>
        </div>

        <aside className="h-fit border border-zinc-100 bg-zinc-50/40 p-6">
          <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900">
            Order summary
          </h2>
          <ul className="mt-4 space-y-4">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-zinc-100">
                  <Image
                    src={item.product.image}
                    alt={item.product.alt}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal uppercase tracking-[0.1em] text-zinc-900">
                    {item.product.name}
                  </p>
                  <p className="mt-0.5 text-[11px] font-light text-zinc-500">
                    Qty {item.quantity}
                  </p>
                  <p className="mt-1 text-sm font-light text-zinc-800">{item.lineTotal}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between font-light text-zinc-600">
              <span>Subtotal</span>
              <span>{cart.subtotal}</span>
            </div>
            <div className="flex justify-between font-normal text-zinc-900">
              <span>Total</span>
              <span>{formatPaise(totalPaise)}</span>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-light text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !razorpayReady}
            className="mt-6 w-full cursor-pointer bg-zinc-900 px-6 py-3.5 text-[11px] font-normal uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Processing…" : "Pay with Razorpay"}
          </button>

          <Link
            href="/cart"
            className="mt-4 block text-center text-[11px] font-light uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-900"
          >
            ← Back to bag
          </Link>
        </aside>
      </form>
    </>
  );
}
