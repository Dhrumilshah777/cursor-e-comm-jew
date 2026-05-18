"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import type { AccountOrder, DeliveryAddress, TimelineStep } from "@/data/accountOrders";
import { getOrderDetailPath } from "@/data/accountOrders";
import {
  getReturnTimelineForStatus,
  RETURN_REASONS,
  returnReasonNeedsPhotos,
  type ReturnAdminStatus,
  type ReturnReason,
} from "@/data/returnRequest";
import {
  fetchReturnForOrder,
  filesToDataUrls,
  submitReturnRequest,
  type CustomerReturnSummary,
} from "@/lib/returnsApi";

const STEP_SEQUENCE_WITH_PHOTOS = [1, 2, 3, 4, 5, 6, 7] as const;
const STEP_SEQUENCE_NO_PHOTOS = [1, 2, 4, 5, 6, 7] as const;

function getStepSequence(needsPhotos: boolean): number[] {
  return needsPhotos ? [...STEP_SEQUENCE_WITH_PHOTOS] : [...STEP_SEQUENCE_NO_PHOTOS];
}

function StepHeading({
  displayStep,
  totalSteps,
  title,
}: {
  displayStep: number;
  totalSteps: number;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-500">
        Step {displayStep} of {totalSteps}
      </p>
      <h2 className="mt-1 text-lg font-light uppercase tracking-[0.12em] text-zinc-950 sm:text-xl">
        {title}
      </h2>
    </div>
  );
}

function ReturnStatusTimeline({ steps }: { steps: TimelineStep[] }) {
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
            <div className="min-w-0 flex-1">
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

function ImageUploadZone({
  id,
  label,
  hint,
  files,
  onFilesChange,
}: {
  id: string;
  label: string;
  hint: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) onFilesChange([...files, ...picked]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-8 transition hover:border-zinc-500 hover:bg-zinc-50"
      >
        <span className="text-[11px] font-light uppercase tracking-[0.16em] text-zinc-800">
          {label}
        </span>
        <span className="mt-2 text-center text-xs font-light text-zinc-500">{hint}</span>
        <span className="mt-4 border border-zinc-300 px-4 py-2 text-[10px] font-light uppercase tracking-[0.14em] text-zinc-700">
          Choose files
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleChange}
      />
      {files.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative">
              <div className="relative h-20 w-20 overflow-hidden bg-zinc-100">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute -right-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center bg-zinc-900 text-[10px] text-white"
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

type ReturnRequestFlowProps = {
  order: AccountOrder;
};

export default function ReturnRequestFlow({ order }: ReturnRequestFlowProps) {
  const [submitted, setSubmitted] = useState(Boolean(order.returnRequest));
  const [returnData, setReturnData] = useState<CustomerReturnSummary | null>(
    order.returnRequest ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [packagingImages, setPackagingImages] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState<DeliveryAddress>(order.deliveryAddress);
  const [editingAddress, setEditingAddress] = useState(false);
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order.returnRequest) return;
    fetchReturnForOrder(order.id).then((data) => {
      if (data) {
        setReturnData(data);
        setSubmitted(true);
      }
    });
  }, [order.id, order.returnRequest]);

  const selectedItem = order.items.find((item) => item.slug === selectedSlug);
  const needsPhotos = returnReasonNeedsPhotos(reason);
  const stepSequence = getStepSequence(needsPhotos);
  const stepIndex = stepSequence.indexOf(step);
  const displayStep = stepIndex >= 0 ? stepIndex + 1 : 1;
  const totalSteps = stepSequence.length;
  const isLastStep = stepIndex === stepSequence.length - 1;

  const handleReasonChange = (option: ReturnReason) => {
    setReason(option);
    if (!returnReasonNeedsPhotos(option)) {
      setProductImages([]);
      setPackagingImages([]);
    }
  };

  const canContinue = useCallback(() => {
    if (step === 1) return Boolean(selectedSlug);
    if (step === 2) return Boolean(reason);
    if (step === 3) return needsPhotos ? productImages.length > 0 : true;
    if (step === 4) return true;
    if (step === 5) return Boolean(address.name && address.line1 && address.pincode);
    if (step === 6) return policyConfirmed;
    return true;
  }, [step, selectedSlug, reason, needsPhotos, productImages.length, address, policyConfirmed]);

  const goNext = () => {
    if (!canContinue()) {
      if (step === 3 && needsPhotos) {
        setError("Please upload at least one product image.");
      } else if (step === 6) {
        setError("Please confirm the return policy to continue.");
      } else {
        setError("Please complete this step before continuing.");
      }
      return;
    }
    setError(null);
    if (stepIndex >= 0 && stepIndex < stepSequence.length - 1) {
      setStep(stepSequence[stepIndex + 1]!);
    }
  };

  const goBack = () => {
    setError(null);
    if (stepIndex > 0) {
      setStep(stepSequence[stepIndex - 1]!);
    }
  };

  const handleSubmit = async () => {
    if (
      !policyConfirmed ||
      !selectedSlug ||
      !selectedItem ||
      !reason ||
      (needsPhotos && productImages.length === 0)
    ) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const [productUrls, packagingUrls] = await Promise.all([
        needsPhotos ? filesToDataUrls(productImages) : Promise.resolve([]),
        packagingImages.length > 0 ? filesToDataUrls(packagingImages) : Promise.resolve([]),
      ]);
      const created = await submitReturnRequest({
        orderId: order.id,
        orderItemId: selectedItem.id,
        reason,
        customerNotes: notes.trim() || undefined,
        policyConfirmed: true,
        pickupAddress: {
          name: address.name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          phone: address.phone,
        },
        productImageUrls: productUrls.length ? productUrls : undefined,
        packagingImageUrls: packagingUrls.length ? packagingUrls : undefined,
      });
      setReturnData(created);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit return");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-8 space-y-8">
        <div className="border border-zinc-100 bg-zinc-50/40 px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-emerald-700">
            Success
          </p>
          <h2 className="mt-3 text-xl font-light uppercase tracking-[0.1em] text-zinc-950 sm:text-2xl">
            Return Request Submitted
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-zinc-600">
            Our team will review your request within 24 hours. You will receive updates
            once your return is approved for pickup.
          </p>
        </div>

        <section className="border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.22em] text-zinc-900">
            Return status
          </h3>
          <ReturnStatusTimeline
            steps={getReturnTimelineForStatus(
              (returnData?.status ?? "under_review") as ReturnAdminStatus,
              returnData?.submittedAt,
              returnData?.pickupScheduledFor ?? undefined,
            )}
          />
          {returnData?.pickupScheduledFor ? (
            <p className="mt-4 text-sm font-light text-zinc-700">
              Shiprocket reverse pickup:{" "}
              <span className="text-zinc-900">{returnData.pickupScheduledFor}</span>
            </p>
          ) : returnData?.status === "pickup_scheduled" && !returnData.refundStatus ? (
            <p className="mt-4 text-xs font-light text-zinc-500">
              Refund will be processed after we receive and inspect your item at our
              warehouse.
            </p>
          ) : (
            <p className="mt-4 text-xs font-light text-zinc-500">
              Your return is under manual review. We do not auto-approve jewellery returns.
            </p>
          )}
          {returnData?.refundStatus === "INITIATED" ||
          returnData?.refundStatus === "PROCESSED" ? (
            <p className="mt-2 text-xs font-light text-emerald-800">
              Refund{" "}
              {returnData.refundStatus === "PROCESSED" ? "processed" : "initiated"} — credited
              to your original payment method in 5–7 business days.
            </p>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={getOrderDetailPath(order.id)}
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

  return (
    <div className="mt-8 max-w-2xl">
      <Link
        href={getOrderDetailPath(order.id)}
        className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 transition hover:text-zinc-900"
      >
        <span aria-hidden="true">←</span>
        Order #{order.orderNumber}
      </Link>

      <p className="mt-6 text-sm font-light text-zinc-600">Request a return for this order.</p>

      {error ? (
        <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-xs font-light text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-8 border border-zinc-100 px-5 py-6 sm:px-8 sm:py-8">
        {step === 1 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Select product" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Choose the item you would like to return.
            </p>
            <ul className="mt-6 space-y-3">
              {order.items.map((item) => {
                const selected = selectedSlug === item.slug;
                return (
                  <li key={item.slug}>
                    <label
                      className={`flex cursor-pointer gap-4 border p-4 transition sm:gap-5 ${
                        selected
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="return-product"
                        value={item.slug}
                        checked={selected}
                        onChange={() => setSelectedSlug(item.slug)}
                        className="sr-only"
                      />
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-zinc-100 sm:h-20 sm:w-20">
                        <Image
                          src={item.image}
                          alt={item.alt}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-normal uppercase tracking-[0.14em] text-zinc-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[11px] font-light text-zinc-500">
                          {item.metal} · {item.purity}
                        </p>
                        <p className="mt-2 text-[10px] font-light uppercase tracking-[0.14em] text-zinc-700">
                          Return this item
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Return reason" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Select the reason that best describes your return.
            </p>
            {needsPhotos ? (
              <p className="mt-2 text-xs font-light text-zinc-500">
                Product and packaging photos will be required in the next step.
              </p>
            ) : reason ? (
              <p className="mt-2 text-xs font-light text-zinc-500">
                No photos are required for this return reason.
              </p>
            ) : null}
            <ul className="mt-6 space-y-2">
              {RETURN_REASONS.map((option) => {
                const selected = reason === option;
                return (
                  <li key={option}>
                    <label
                      className={`block cursor-pointer border px-4 py-3.5 transition ${
                        selected
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="return-reason"
                        value={option}
                        checked={selected}
                        onChange={() => handleReasonChange(option)}
                        className="sr-only"
                      />
                      <span className="text-xs font-light uppercase tracking-[0.12em] text-zinc-900">
                        {option}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === 3 && needsPhotos ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Upload images" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Clear photos help us review your jewellery return. Please include product
              and packaging images for damaged or wrong-item cases.
            </p>
            <div className="mt-6 space-y-6">
              <ImageUploadZone
                id="product-images"
                label="Upload product images"
                hint="Front, back, and any visible damage or defects"
                files={productImages}
                onFilesChange={setProductImages}
              />
              <ImageUploadZone
                id="packaging-images"
                label="Upload packaging images"
                hint="Box, pouch, certificate, and outer packaging"
                files={packagingImages}
                onFilesChange={setPackagingImages}
              />
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Additional notes" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Optional — share any details that will help our team.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Tell us more about the issue"
              className="mt-6 w-full resize-y border border-zinc-200 bg-white px-4 py-3 text-sm font-light text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
            />
          </section>
        ) : null}

        {step === 5 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Pickup address" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              We will arrange pickup from this address.
            </p>
            {editingAddress ? (
              <div className="mt-6 space-y-3">
                {(
                  [
                    ["name", "Full name"],
                    ["line1", "Address line 1"],
                    ["line2", "Address line 2"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                    ["phone", "Phone"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={address[key]}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="mt-1 w-full border border-zinc-200 px-3 py-2 text-sm font-light text-zinc-900 focus:border-zinc-500 focus:outline-none"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setEditingAddress(false)}
                  className="cursor-pointer text-[10px] font-light uppercase tracking-[0.16em] text-zinc-900 underline"
                >
                  Save address
                </button>
              </div>
            ) : (
              <address className="mt-6 space-y-1 border border-zinc-100 bg-zinc-50/50 p-5 text-sm font-light not-italic text-zinc-700">
                <p className="text-zinc-900">{address.name}</p>
                <p>{address.line1}</p>
                <p>
                  {address.line2}, {address.city}, {address.state}
                </p>
                <p>{address.pincode}</p>
                <p className="pt-2 text-zinc-900">{address.phone}</p>
              </address>
            )}
            {!editingAddress ? (
              <button
                type="button"
                onClick={() => setEditingAddress(true)}
                className="mt-4 cursor-pointer border border-zinc-300 px-4 py-2 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-800 transition hover:border-zinc-500"
              >
                Change address
              </button>
            ) : null}
          </section>
        ) : null}

        {step === 6 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Return policy" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Please confirm your item meets our return guidelines.
            </p>
            <label className="mt-6 flex cursor-pointer gap-3 border border-zinc-200 p-4">
              <input
                type="checkbox"
                checked={policyConfirmed}
                onChange={(e) => setPolicyConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900"
              />
              <span className="text-sm font-light leading-relaxed text-zinc-700">
                I confirm the product is unused and returned with original packaging.
              </span>
            </label>
          </section>
        ) : null}

        {step === 7 ? (
          <section>
            <StepHeading displayStep={displayStep} totalSteps={totalSteps} title="Submit return request" />
            <p className="mt-3 text-sm font-light text-zinc-600">
              Review your request before submitting. Our team will manually review it
              within 24 hours.
            </p>
            <dl className="mt-6 space-y-3 border border-zinc-100 bg-zinc-50/40 p-5 text-sm font-light">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Product</dt>
                <dd className="text-right text-zinc-900">{selectedItem?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Reason</dt>
                <dd className="text-right text-zinc-900">{reason}</dd>
              </div>
              {needsPhotos ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Images</dt>
                  <dd className="text-right text-zinc-900">
                    {productImages.length} product, {packagingImages.length} packaging
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Pickup</dt>
                <dd className="text-right text-zinc-900">
                  {address.city}, {address.pincode}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-6 w-full cursor-pointer border border-zinc-900 bg-zinc-900 px-5 py-3 text-[11px] font-light uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit return request"}
            </button>
          </section>
        ) : null}

        {!isLastStep ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-6">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex <= 0}
              className="cursor-pointer border border-zinc-300 px-4 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-zinc-700 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="cursor-pointer border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.16em] text-white transition hover:bg-zinc-800"
            >
              Continue
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
