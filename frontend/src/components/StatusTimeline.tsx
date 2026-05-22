import type { TimelineStep } from "@/data/accountOrders";

type StatusTimelineProps = {
  steps: TimelineStep[];
};

export default function StatusTimeline({ steps }: StatusTimelineProps) {
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
