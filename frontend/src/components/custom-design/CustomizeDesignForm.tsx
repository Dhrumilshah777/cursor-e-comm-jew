"use client";

import Image from "next/image";
import Link from "next/link";
import { Jost } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import {
  clearCustomDesignUpload,
  getCustomDesignUpload,
  readImageFile,
  saveCustomDesignUpload,
  type CustomDesignUpload,
} from "@/lib/customDesignStorage";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const jewelleryTypes = [
  "Pendants",
  "Rings",
  "Earrings",
  "Necklaces",
  "Bracelets",
  "Bangles",
  "Mangalsutra",
] as const;

const metalOptions = ["14KT Gold", "18KT Gold", "22KT Gold"] as const;

const goldColours = ["Yellow Gold", "Rose Gold", "White Gold"] as const;

const stoneTypes = [
  "No Stone",
  "Premium CZ",
  "Moissanite",
  "Lab Diamond",
  "Natural Diamond",
] as const;

const budgetRanges = [
  "Under ₹20,000",
  "₹20,000 - ₹40,000",
  "₹40,000 - ₹75,000",
  "₹75,000 - ₹1,50,000",
  "Above ₹1,50,000",
] as const;

type FormState = {
  jewelleryType: (typeof jewelleryTypes)[number];
  metal: (typeof metalOptions)[number];
  goldColour: (typeof goldColours)[number];
  stoneType: (typeof stoneTypes)[number];
  budget: (typeof budgetRanges)[number];
  needByDate: string;
  notes: string;
};

const defaultForm: FormState = {
  jewelleryType: "Pendants",
  metal: "18KT Gold",
  goldColour: "Yellow Gold",
  stoneType: "Premium CZ",
  budget: "₹20,000 - ₹40,000",
  needByDate: "",
  notes: "",
};

export default function CustomizeDesignForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<CustomDesignUpload | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setUpload(getCustomDesignUpload());
  }, []);

  const openFilePicker = () => {
    setUploadError(null);
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const nextUpload = await readImageFile(file);
      saveCustomDesignUpload(nextUpload);
      setUpload(nextUpload);
      setUploadError(null);
    } catch (caught) {
      setUploadError(
        caught instanceof Error ? caught.message : "Could not upload image.",
      );
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="font-serif text-3xl font-light text-zinc-900">
          Thank you
        </h2>
        <p className="mt-4 text-sm font-light leading-relaxed text-zinc-600">
          We&apos;ve received your custom design request. Our team will review
          your details and get in touch with you shortly.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center bg-zinc-900 px-8 py-3 text-[11px] font-light uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-2 lg:gap-12">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-900">
          Your Design
        </h2>
        <div className="mt-4 border border-zinc-200 bg-white p-4 sm:p-5">
          {upload ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-sm font-light text-zinc-800">
                  {upload.fileName}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearCustomDesignUpload();
                    setUpload(null);
                  }}
                  className="shrink-0 text-zinc-400 transition hover:text-zinc-700"
                  aria-label="Remove uploaded design"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                onClick={openFilePicker}
                className="mt-1 text-xs font-light text-zinc-500 underline underline-offset-2 transition hover:text-zinc-800"
              >
                Change image
              </button>
              <div className="relative mt-4 aspect-square w-full overflow-hidden bg-zinc-50">
                <Image
                  src={upload.dataUrl}
                  alt="Uploaded jewellery design"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-light text-zinc-600">
                No design uploaded yet
              </p>
              <button
                type="button"
                onClick={openFilePicker}
                className="mt-4 inline-flex min-h-10 items-center justify-center border border-zinc-900 px-6 py-2 text-[11px] font-light uppercase tracking-[0.18em] text-zinc-900 transition hover:bg-zinc-50"
              >
                Upload image
              </button>
            </div>
          )}
          {uploadError ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Jewellery Type">
          <select
            value={form.jewelleryType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                jewelleryType: event.target
                  .value as FormState["jewelleryType"],
              }))
            }
            className={fieldClass}
          >
            {jewelleryTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Metal">
          <select
            value={form.metal}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                metal: event.target.value as FormState["metal"],
              }))
            }
            className={fieldClass}
          >
            {metalOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gold Colour">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {goldColours.map((colour) => {
              const selected = form.goldColour === colour;
              return (
                <button
                  key={colour}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, goldColour: colour }))
                  }
                  className={`min-h-11 border px-3 py-2 text-xs font-light transition ${
                    selected
                      ? "border-amber-600 bg-amber-50 text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {colour}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Stone Type">
          <select
            value={form.stoneType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                stoneType: event.target.value as FormState["stoneType"],
              }))
            }
            className={fieldClass}
          >
            {stoneTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Approx Budget">
            <select
              value={form.budget}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  budget: event.target.value as FormState["budget"],
                }))
              }
              className={fieldClass}
            >
              {budgetRanges.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Need by Date">
            <input
              type="date"
              value={form.needByDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  needByDate: event.target.value,
                }))
              }
              className={fieldClass}
            />
          </Field>
        </div>

        <Field label="Additional Notes (Optional)">
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            rows={4}
            placeholder="Any specific instructions, size preferences, etc."
            className={`${fieldClass} resize-y`}
          />
        </Field>

        <button
          type="submit"
          className="mt-2 w-full min-h-12 bg-zinc-900 py-3 text-[11px] font-light uppercase tracking-[0.22em] text-white transition hover:bg-zinc-800"
        >
          Continue
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload design image"
      />
    </form>
  );
}

const fieldClass =
  "w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm font-light text-zinc-800 outline-none transition focus:border-zinc-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-light uppercase tracking-[0.16em] text-zinc-700">
        {label}
      </span>
      {children}
    </label>
  );
}
