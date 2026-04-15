import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  avg: number;
  count: number;
  className?: string;
  size?: "sm" | "md";
  /** Shorter copy for dense UI (e.g. listing cards). */
  emptyMode?: "default" | "minimal";
};

export function StarDisplay({
  avg,
  count,
  className,
  size = "md",
  emptyMode = "default",
}: Props) {
  const rounded = Math.round(avg * 2) / 2;
  const starClass =
    size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (count === 0) {
    if (emptyMode === "minimal") {
      return (
        <span className={cn("text-[11px] text-zinc-400 dark:text-zinc-500", className)}>
          No reviews
        </span>
      );
    }
    return (
      <p className={cn("text-xs text-zinc-500 dark:text-zinc-400", className)}>
        No ratings yet
      </p>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      title={`${avg.toFixed(1)} out of 5 from ${count} ${count === 1 ? "review" : "reviews"}`}
    >
      <span className="flex items-center gap-0.5 text-amber-500" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              starClass,
              i <= Math.round(rounded)
                ? "fill-current"
                : "fill-none stroke-current stroke-[1.5]"
            )}
          />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
        {avg.toFixed(1)}
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        ({count})
      </span>
    </div>
  );
}
