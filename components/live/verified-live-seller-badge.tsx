import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** Smaller chip for cards */
  compact?: boolean;
};

export function VerifiedLiveSellerBadge({ className, compact }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-emerald-100 font-semibold text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100",
        compact ? "px-1.5 py-0 text-[9px] uppercase" : "px-2 py-0.5 text-[10px]",
        className
      )}
      title="Verified live seller — approved by GoBenta"
    >
      <BadgeCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {!compact ? "Verified live" : "Live ✓"}
    </span>
  );
}
