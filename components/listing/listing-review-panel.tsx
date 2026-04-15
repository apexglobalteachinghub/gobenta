"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import type { ListingReviewBrief } from "@/lib/queries/reviews";

type Props = {
  listingId: string;
  sellerId: string;
  buyerId: string | null;
  completedAt: string | null;
  currentUserId: string | null;
  reviews: ListingReviewBrief[];
  counterpartyLabel: "seller" | "buyer";
  counterpartyName: string;
};

export function ListingReviewPanel({
  listingId,
  sellerId,
  buyerId,
  completedAt,
  currentUserId,
  reviews,
  counterpartyLabel,
  counterpartyName,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  if (!completedAt || !buyerId || !currentUserId) return null;

  const isSeller = currentUserId === sellerId;
  const isBuyer = currentUserId === buyerId;
  if (!isSeller && !isBuyer) return null;

  const revieweeId = isSeller ? buyerId : sellerId;
  const mine = reviews.find((r) => r.reviewer_id === currentUserId);

  if (mine) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          Your rating for this {counterpartyLabel}
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          You gave {counterpartyName}{" "}
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {mine.rating} / 5
          </span>{" "}
          stars.
        </p>
        {mine.comment?.trim() ? (
          <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200">
            {mine.comment.trim()}
          </p>
        ) : null}
      </div>
    );
  }

  async function submit() {
    if (rating < 1 || rating > 5) {
      toast.error("Choose a star rating from 1 to 5.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const trimmed = comment.trim();
    const { error } = await supabase.from("user_reviews").insert({
      listing_id: listingId,
      reviewer_id: currentUserId,
      reviewee_id: revieweeId,
      rating,
      comment: trimmed || null,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Thanks — your rating was saved.");
    setRating(0);
    setComment("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/80">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Rate this {counterpartyLabel}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {counterpartyName} · one review per listing
      </p>
      <div className="mt-3 flex items-center gap-1" role="group" aria-label="Rating 1 to 5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setRating(v)}
            className="rounded-md p-1 text-amber-500 transition hover:scale-110 focus-visible:outline focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={`${v} star${v === 1 ? "" : "s"}`}
            aria-pressed={rating === v}
          >
            <Star
              className={cn(
                "h-8 w-8",
                v <= rating ? "fill-current" : "fill-none stroke-current stroke-[1.5]"
              )}
            />
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Comment (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Brief note about the transaction…"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      <button
        type="button"
        disabled={pending || rating < 1}
        onClick={() => void submit()}
        className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit rating"}
      </button>
    </div>
  );
}
