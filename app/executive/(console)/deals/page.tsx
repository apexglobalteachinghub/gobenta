"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  ExecutiveDealInsights,
  ExecutiveListingChatRow,
} from "@/app/api/executive/deals/route";
import { cn } from "@/lib/cn";

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ExecutiveDealsPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<ExecutiveDealInsights | null>(null);
  const [rows, setRows] = useState<ExecutiveListingChatRow[]>([]);
  const [limit] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/executive/deals?page=${page}&limit=${limit}`,
        { credentials: "same-origin" }
      );
      const body = (await res.json()) as {
        insights?: ExecutiveDealInsights;
        rows?: ExecutiveListingChatRow[];
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Could not load deal data", {
          description: body.hint,
        });
        setInsights(null);
        setRows([]);
        return;
      }
      setInsights(body.insights ?? null);
      setRows(body.rows ?? []);
    } catch {
      toast.error("Network error");
      setInsights(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const sold = insights?.marked_sold_count ?? 0;
  const negotiating = insights?.under_negotiation_count ?? 0;
  const withChat = insights?.listings_with_chat_count ?? 0;
  const msgs = insights?.total_messages_count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Marketplace activity
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Deals &amp; chat
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Listings where buyers and sellers are messaging.{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            Under negotiation
          </strong>{" "}
          counts live listings (not marked sold) that already have at least one
          message.{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            Marked sold
          </strong>{" "}
          is listings with a completed transaction timestamp.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Marked sold"
          value={sold.toLocaleString("en-PH")}
          hint="transaction_completed_at is set"
          tone="emerald"
        />
        <Stat
          label="Under negotiation"
          value={negotiating.toLocaleString("en-PH")}
          hint="Has messages · listing still for sale"
          tone="amber"
        />
        <Stat
          label="Listings with chat"
          value={withChat.toLocaleString("en-PH")}
          hint="Distinct listings that have any thread"
          tone="sky"
        />
        <Stat
          label="Total messages"
          value={msgs.toLocaleString("en-PH")}
          hint="All rows in messages"
          tone="violet"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/80">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Listings with active conversations
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Sorted by most recent message. Open the public listing to see the
            thread in context.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Listing &amp; seller</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Messages</th>
                <th className="px-4 py-3 text-right">People in chat</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3">Buyer (if sold)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    No listings with messages yet, or RPC not installed. Run{" "}
                    <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
                      supabase/executive_deals_chat.sql
                    </code>
                    .
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const soldRow = !!r.transaction_completed_at;
                  return (
                    <tr
                      key={r.listing_id}
                      className="text-zinc-800 dark:text-zinc-200"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/listing/${r.listing_id}`}
                          className="font-medium text-brand hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.title}
                        </Link>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          Seller: {r.seller_name || "—"}{" "}
                          <span className="font-mono text-[11px]">
                            ({r.seller_id.slice(0, 8)}…)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {soldRow ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
                            Sold
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                            Negotiating
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.message_count.toLocaleString("en-PH")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {r.participant_count.toLocaleString("en-PH")}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatWhen(r.last_message_at)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {soldRow && r.buyer_id ? (
                          <span>
                            {r.buyer_name || "—"}{" "}
                            <span className="font-mono text-[11px] text-zinc-500">
                              ({r.buyer_id.slice(0, 8)}…)
                            </span>
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs dark:border-zinc-800">
          <span className="text-zinc-500">Page {page}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={rows.length < limit || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Tip: “People in chat” is the count of distinct accounts that appear as
        sender or receiver on that listing (usually seller + one or more
        interested buyers).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "emerald" | "amber" | "sky" | "violet";
}) {
  const ring = {
    emerald: "from-emerald-600/90 to-brand",
    amber: "from-amber-600 to-orange-700",
    sky: "from-sky-600 to-blue-700",
    violet: "from-violet-600 to-indigo-700",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm",
        "dark:border-zinc-800/90 dark:bg-zinc-900/80"
      )}
    >
      <div
        className={cn(
          "mb-3 h-1 w-12 rounded-full bg-gradient-to-r",
          ring
        )}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {hint}
      </p>
    </div>
  );
}
