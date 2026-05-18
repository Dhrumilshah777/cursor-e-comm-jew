import { RETURN_ELIGIBILITY_RULES } from "@/data/returnRequest";

export default function ReturnEligibilityRules({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`border border-zinc-100 bg-[#faf8f5] ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <p className="text-[10px] font-normal uppercase tracking-[0.22em] text-zinc-900">
        Return eligible if
      </p>
      <ul className={`mt-3 space-y-2 ${compact ? "text-xs" : "text-sm"} font-light text-zinc-700`}>
        {RETURN_ELIGIBILITY_RULES.map((rule) => (
          <li key={rule} className="flex gap-2">
            <span className="text-zinc-400" aria-hidden="true">
              ·
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
