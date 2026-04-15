import type { ReceivedReviewDisplay } from "@/types/database";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

export function ProfileReviewsList({
  reviews,
}: {
  reviews: ReceivedReviewDisplay[];
}) {
  if (!reviews.length) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No reviews yet. Complete a deal and ask the other person to leave a
        rating.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex text-amber-500" aria-hidden>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i <= r.rating ? "fill-current" : "fill-none stroke-current stroke-[1.5]"
                  )}
                />
              ))}
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {r.reviewer_name}
            </span>
            {r.listing_title ? (
              <span className="text-xs text-zinc-500">
                · {r.listing_title}
              </span>
            ) : null}
          </div>
          {r.comment?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {r.comment.trim()}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-zinc-400">No written comment</p>
          )}
          <p className="mt-2 text-[11px] text-zinc-400">
            {new Date(r.created_at).toLocaleDateString("en-PH", {
              dateStyle: "medium",
            })}
          </p>
        </li>
      ))}
    </ul>
  );
}
