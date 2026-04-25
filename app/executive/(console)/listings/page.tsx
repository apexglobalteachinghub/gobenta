"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

type ListingRow = {
  id: string;
  title: string;
  price: number;
  created_at: string;
  user_id: string;
  seller_name: string;
};

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default function ExecutiveListingsPage() {
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (userId.trim()) params.set("userId", userId.trim());
      const res = await fetch(`/api/executive/listings?${params}`, {
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        listings?: ListingRow[];
        error?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Could not load listings");
        setListings([]);
        return;
      }
      setListings(body.listings ?? []);
    } catch {
      toast.error("Network error");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [q, userId]);

  async function reoptimize(listingId: string) {
    setBusyId(listingId);
    try {
      const res = await fetch(
        `/api/executive/listings/${listingId}/reoptimize-images`,
        { method: "POST", credentials: "same-origin" }
      );
      const body = (await res.json()) as {
        processed?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Reoptimize failed");
        return;
      }
      const n = body.processed ?? 0;
      const errs = body.errors ?? [];
      if (errs.length) {
        toast.message(`Processed ${n} image(s); some issues`, {
          description: errs.slice(0, 3).join(" · "),
        });
      } else {
        toast.success(`Reoptimized ${n} image(s)`);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Catalog
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Listings
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Search live listings and recompress photos in Storage for a specific
          row (WebP/JPEG, max edge 1600px). Useful for legacy uploads that bypassed
          the browser pipeline.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/80 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title contains
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. Honda"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block w-full text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:w-72">
          Seller user ID
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID (optional)"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Images</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">
                    {loading
                      ? "Loading…"
                      : "Run a search to load listings."}
                  </td>
                </tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="max-w-xs font-medium">{row.title}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                        {row.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.seller_name || "—"}</div>
                      <div className="font-mono text-[11px] text-zinc-500">
                        {row.user_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {money.format(Number(row.price) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void reoptimize(row.id)}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-60 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      >
                        {busyId === row.id ? "Working…" : "Reoptimize photos"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
