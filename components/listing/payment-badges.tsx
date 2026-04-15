import type { PaymentOption } from "@/types/database";
import { cn } from "@/lib/cn";

const LABELS: Record<PaymentOption, string> = {
  gcash: "GCash",
  maya: "Maya",
  cod: "COD",
  pasabuy: "Pasabuy",
};

export function PaymentBadges({
  options,
  className,
}: {
  options: PaymentOption[];
  className?: string;
}) {
  if (!options?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {options.map((o) => (
        <span
          key={o}
          className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
        >
          {LABELS[o]}
        </span>
      ))}
    </div>
  );
}
