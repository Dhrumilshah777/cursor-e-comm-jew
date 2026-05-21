"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import {
  createRazorpayCheckoutOrder,
  fetchCheckoutAddresses,
  verifyRazorpayPayment,
  applyCheckoutCoupon,
  fetchAvailableCheckoutCoupons,
  type AvailableCheckoutCoupon,
  type CheckoutAddress,
  type SavedCheckoutAddress,
} from "@/lib/checkoutApi";
import { fetchCustomerMe, getCustomerToken } from "@/lib/customerAuth";

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function phoneFromSaved(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function formatAddressSummary(address: SavedCheckoutAddress): string {
  const parts = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function CheckoutPageContent() {
  const router = useRouter();
  const { cart, loading, refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedCheckoutAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
    discount: string;
    valueLabel: string;
    totalPaise: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCheckoutCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace("/login?redirect=%2Fcheckout");
      return;
    }

    let cancelled = false;

    Promise.all([fetchCheckoutAddresses(), fetchCustomerMe()])
      .then(([addresses, user]) => {
        if (cancelled) return;
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          const defaultId =
            addresses.find((a) => a.isDefault)?.id ?? addresses[0]!.id;
          setSelectedAddressId(defaultId);
          setShowNewAddressForm(false);
        } else {
          setShowNewAddressForm(true);
        }
        if (user?.phone) {
          setPhone(phoneFromSaved(user.phone));
        }
      })
      .catch(() => {
        if (!cancelled) setShowNewAddressForm(true);
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const getNewAddress = (): CheckoutAddress => ({
    name,
    line1,
    line2: line2 || undefined,
    city,
    state,
    pincode,
    phone,
    saveAddress,
  });

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponInput).trim();
    if (!code) return;

    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const preview = await applyCheckoutCoupon(code);
      if (!preview.coupon) {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }
      setCouponInput(code);
      setAppliedCoupon({
        code: preview.coupon.code,
        discountPaise: preview.discountPaise,
        discount: preview.coupon.discount,
        valueLabel: preview.coupon.valueLabel,
        totalPaise: preview.totalPaise,
      });
      setShowAvailableCoupons(false);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Could not apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const loadAvailableCoupons = async () => {
    setLoadingCoupons(true);
    setCouponsError(null);
    try {
      const coupons = await fetchAvailableCheckoutCoupons();
      setAvailableCoupons(coupons);
    } catch (err) {
      setCouponsError(err instanceof Error ? err.message : "Could not load coupons");
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleToggleAvailableCoupons = async () => {
    const next = !showAvailableCoupons;
    setShowAvailableCoupons(next);
    if (next) {
      await loadAvailableCoupons();
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const handlePay = async (event: FormEvent) => {
    event.preventDefault();
    if (!cart || cart.items.length === 0 || !razorpayReady || !window.Razorpay) {
      if (!razorpayReady) {
        setError("Payment gateway is still loading. Please wait a moment.");
      }
      return;
    }

    const useSaved =
      !showNewAddressForm && selectedAddressId && savedAddresses.length > 0;

    if (!useSaved) {
      if (
        !name.trim() ||
        !line1.trim() ||
        !city.trim() ||
        !state.trim() ||
        pincode.length !== 6 ||
        phone.length !== 10
      ) {
        setError("Please complete the delivery address.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const selected = savedAddresses.find((a) => a.id === selectedAddressId);
      const paymentOrder = await createRazorpayCheckoutOrder({
        ...(useSaved && selectedAddressId
          ? { addressId: selectedAddressId }
          : { address: getNewAddress() }),
        couponCode: appliedCoupon?.code,
      });

      const prefillName = useSaved && selected ? selected.name : name;
      const prefillPhone =
        useSaved && selected ? phoneFromSaved(selected.phone) : phone;

      const rzp = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Wholesale Jewelry",
        description: "Jewelry order payment",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: prefillName,
          contact: prefillPhone.length === 10 ? `+91${prefillPhone}` : prefillPhone,
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

  if (loading || addressesLoading) {
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

  const totalPaise = appliedCoupon?.totalPaise ?? cart.subtotalPaise;
  const discountPaise = appliedCoupon?.discountPaise ?? 0;
  const hasSaved = savedAddresses.length > 0;

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

            {hasSaved && !showNewAddressForm ? (
              <div className="mt-4 space-y-3">
                <ul className="space-y-3">
                  {savedAddresses.map((address) => {
                    const selected = selectedAddressId === address.id;
                    return (
                      <li key={address.id}>
                        <label
                          className={`flex cursor-pointer gap-3 border px-4 py-4 transition ${
                            selected
                              ? "border-zinc-900 bg-zinc-50"
                              : "border-zinc-200 bg-white hover:border-zinc-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selected}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 h-4 w-4 border-zinc-300"
                          />
                          <span className="min-w-0 flex-1 text-sm font-light text-zinc-800">
                            <span className="block text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
                              {address.label}
                            </span>
                            <span className="mt-1 block font-normal text-zinc-900">
                              {address.name}
                            </span>
                            <span className="mt-1 block text-zinc-600">
                              {formatAddressSummary(address)}
                            </span>
                            <span className="mt-1 block text-zinc-500">
                              {phoneFromSaved(address.phone)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewAddressForm(true);
                    setSelectedAddressId(null);
                  }}
                  className="cursor-pointer text-[11px] font-light uppercase tracking-[0.16em] text-zinc-700 underline hover:text-zinc-900"
                >
                  + Add a new address
                </button>
              </div>
            ) : (
              <div className="mt-4">
                {hasSaved ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(false);
                      setSelectedAddressId(
                        savedAddresses.find((a) => a.isDefault)?.id ??
                          savedAddresses[0]?.id ??
                          null,
                      );
                    }}
                    className="mb-4 cursor-pointer text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 underline hover:text-zinc-900"
                  >
                    ← Use a saved address
                  </button>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
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
                      onChange={(e) =>
                        setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
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
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
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
              </div>
            )}
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

          <div className="mt-6 space-y-3 border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
                Coupon code
              </p>
              {!appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleToggleAvailableCoupons}
                  className="cursor-pointer text-[10px] font-light uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-900"
                >
                  {showAvailableCoupons ? "Hide offers" : "View available coupons"}
                </button>
              ) : null}
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
                <div>
                  <p className="font-normal text-emerald-900">{appliedCoupon.code}</p>
                  <p className="text-[11px] font-light text-emerald-800">
                    {appliedCoupon.valueLabel} applied
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-[10px] uppercase tracking-[0.14em] text-emerald-900 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-2.5 text-sm font-light uppercase focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="shrink-0 border border-zinc-900 px-4 py-2.5 text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-900 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
                >
                  {applyingCoupon ? "…" : "Apply"}
                </button>
              </div>
            )}
            {showAvailableCoupons && !appliedCoupon ? (
              <div className="space-y-2 border border-zinc-200 bg-white p-3">
                {loadingCoupons ? (
                  <p className="text-[11px] font-light text-zinc-500">Loading offers…</p>
                ) : couponsError ? (
                  <p className="text-[11px] font-light text-red-600">{couponsError}</p>
                ) : availableCoupons.length === 0 ? (
                  <p className="text-[11px] font-light text-zinc-500">
                    No coupons available right now.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {availableCoupons.map((coupon) => (
                      <li
                        key={coupon.code}
                        className={`border px-3 py-2.5 ${
                          coupon.canApply
                            ? "border-zinc-200 bg-zinc-50"
                            : "border-zinc-100 bg-white opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-normal uppercase tracking-[0.12em] text-zinc-900">
                              {coupon.code}
                            </p>
                            <p className="mt-0.5 text-[11px] font-light text-zinc-700">
                              {coupon.valueLabel}
                              {coupon.estimatedDiscount && coupon.canApply
                                ? ` · Save ${coupon.estimatedDiscount}`
                                : ""}
                            </p>
                            {coupon.minOrder ? (
                              <p className="mt-0.5 text-[10px] font-light text-zinc-500">
                                Min order {coupon.minOrder}
                              </p>
                            ) : null}
                            {coupon.validUntil ? (
                              <p className="mt-0.5 text-[10px] font-light text-zinc-500">
                                Valid till {coupon.validUntil}
                              </p>
                            ) : null}
                            {!coupon.canApply && coupon.reason ? (
                              <p className="mt-1 text-[10px] font-light text-amber-700">
                                {coupon.reason}
                              </p>
                            ) : null}
                          </div>
                          {coupon.canApply ? (
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(coupon.code)}
                              disabled={applyingCoupon}
                              className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-zinc-900 hover:underline disabled:opacity-50"
                            >
                              Apply
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
            {couponError ? (
              <p className="text-[11px] font-light text-red-600">{couponError}</p>
            ) : null}
          </div>

          <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between font-light text-zinc-600">
              <span>Subtotal</span>
              <span>{cart.subtotal}</span>
            </div>
            {discountPaise > 0 ? (
              <div className="flex justify-between font-light text-emerald-700">
                <span>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</span>
                <span>-{appliedCoupon?.discount ?? formatPaise(discountPaise)}</span>
              </div>
            ) : null}
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
