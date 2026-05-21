import {
  formatINR,
  formatPurityLabel,
  formatRatePerGram,
  type PriceBreakup,
} from "@/lib/pricing";

type ProductPriceBreakupProps = {
  breakup: PriceBreakup;
};

type BreakupRow = { label: string; amount: number };

function buildRows(breakup: PriceBreakup): BreakupRow[] {
  return [
    {
      label: "Making charge",
      amount: breakup.makingCharge,
    },
    {
      label: `GST (${breakup.gstPercent}%)`,
      amount: breakup.gst,
    },
  ];
}

export default function ProductPriceBreakup({
  breakup,
}: ProductPriceBreakupProps) {
  const rows = buildRows(breakup);

  return (
    <section className="mt-12 border-t border-zinc-100 pt-10 sm:mt-14 sm:pt-12">
      <h2 className="text-sm font-normal uppercase tracking-[0.2em] text-zinc-900 sm:text-base">
        Price breakup
      </h2>

      <dl className="mt-6 w-full max-w-sm sm:max-w-md">
        <div className="flex items-start justify-between gap-x-4 border-b border-zinc-100 py-3.5 sm:gap-x-8">
          <dt className="flex min-w-0 items-start gap-5 pr-2 sm:gap-8">
            <p className="shrink-0 pt-0.5 text-sm font-normal text-zinc-900">
              {formatPurityLabel(breakup.purity)}
            </p>
            <div className="ml-10 sm:ml-14">
              <p className="text-[11px] font-light uppercase tracking-[0.12em] text-zinc-500">
                Weight
              </p>
              <p className="mt-0.5 text-sm font-light text-zinc-900">
                {breakup.netWeightGrams.toFixed(2)} g
              </p>
            </div>
            <div>
              <p className="text-[11px] font-light uppercase tracking-[0.12em] text-zinc-500">
                Rate
              </p>
              <p className="mt-0.5 text-sm font-light text-zinc-900">
                {formatRatePerGram(breakup.pricePerGram)}
              </p>
            </div>
          </dt>
          <dd className="shrink-0 pt-0.5 text-sm font-normal text-zinc-900">
            {formatINR(breakup.goldValue)}
          </dd>
        </div>

        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-x-8 border-b border-zinc-100 py-3.5 sm:gap-x-10"
          >
            <dt className="min-w-0 pr-4">
              <span className="text-sm font-light text-zinc-900">{row.label}</span>
            </dt>
            <dd className="shrink-0 text-sm font-normal text-zinc-900">
              {formatINR(row.amount)}
            </dd>
          </div>
        ))}

        <div className="flex items-baseline justify-between gap-x-8 pt-5 sm:gap-x-10">
          <dt className="text-sm font-normal uppercase tracking-[0.14em] text-zinc-900">
            Total
          </dt>
          <dd className="text-base font-normal text-zinc-950">
            {formatINR(breakup.total)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
