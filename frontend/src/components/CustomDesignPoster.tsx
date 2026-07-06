"use client";

import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  readImageFile,
  saveCustomDesignUpload,
} from "@/lib/customDesignStorage";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SKETCH_IMAGE =
  "https://i.pinimg.com/736x/e2/d5/48/e2d548787d3fcfd8f42e9df6095974d2.jpg";

export default function CustomDesignPoster() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openFilePicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const goToDetails = () => {
    router.push("/custom-design/details");
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const upload = await readImageFile(file);
      saveCustomDesignUpload(upload);
      router.push("/custom-design/details");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not upload image.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`${jost.className} w-full bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8`}
      aria-label="Custom design"
    >
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={goToDetails}
          className="group relative grid w-full cursor-pointer overflow-hidden border border-zinc-200 bg-[#f7f4ef] text-left transition hover:border-zinc-300 md:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <h2
              className={`${cormorant.className} text-4xl font-medium leading-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem]`}
            >
              Have Your Own Design?
            </h2>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-zinc-600 sm:text-[15px]">
              Upload your design or inspiration and we&apos;ll craft it in gold
              just for you.
            </p>
            <span
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              className="mt-8 inline-flex"
            >
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    openFilePicker();
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center bg-zinc-900 px-8 py-3 text-[11px] font-light uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
              >
                {loading ? "Uploading..." : "Upload your design"}
              </span>
            </span>
            {error ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="relative min-h-[240px] bg-[#f0ebe3] sm:min-h-[320px] md:min-h-[360px]">
            <Image
              src={SKETCH_IMAGE}
              alt="Hand sketching a jewellery design"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 45vw"
            />
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload your design image"
        />

        <p className="mt-3 text-center text-xs font-light text-zinc-500">
          Or{" "}
          <Link
            href="/custom-design/details"
            className="underline underline-offset-2 transition hover:text-zinc-800"
          >
            continue without uploading
          </Link>
        </p>
      </div>
    </section>
  );
}
