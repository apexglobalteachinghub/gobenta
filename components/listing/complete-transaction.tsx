"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MessagedPeer } from "@/lib/queries/reviews";

type Props = {
  listingId: string;
  peers: MessagedPeer[];
  buyerId: string | null;
  buyerName: string | null;
  completedAt: string | null;
};

export function CompleteTransactionPanel({
  listingId,
  peers,
  buyerId,
  buyerName,
  completedAt,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(buyerId ?? "");
  const [pending, setPending] = useState(false);

  if (completedAt && buyerId) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <p className="font-semibold">Transaction completed</p>
        <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
          Buyer: {buyerName ?? "Member"} · You can now rate each other below.
        </p>
      </div>
    );
  }

  if (peers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">
          Mark sale complete
        </p>
        <p className="mt-1">
          When you&apos;ve finished the deal, choose the buyer here. The buyer
          must have messaged you on this listing first.
        </p>
      </div>
    );
  }

  async function submit() {
    if (!selected) {
      toast.error("Select the buyer you sold to.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({
        buyer_id: selected,
        transaction_completed_at: new Date().toISOString(),
      })
      .eq("id", listingId);

    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Transaction marked complete. You can leave a review.");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Mark transaction complete
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        After payment and handoff, select the buyer. Both of you can then rate
        each other once.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">
            Buyer (from messages)
          </span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">Choose…</option>
            {peers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending || !selected}
          onClick={() => void submit()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Confirm complete"}
        </button>
      </div>
    </div>
  );
}
