"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Radio, Loader2 } from "lucide-react";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";
import { cn } from "@/lib/cn";

type StreamRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_start_at: string | null;
  started_at: string | null;
  viewer_count: number;
  seller: {
    id: string;
    name: string;
    avatar_url: string | null;
    is_verified_live_seller?: boolean;
  } | null;
};

export function LiveDiscoveryClient() {
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [liveRows, setLiveRows] = useState<StreamRow[]>([]);
  const [upcomingRows, setUpcomingRows] = useState<StreamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [liveRes, schedRes] = await Promise.all([
        fetch(`/api/live/streams?status=live`),
        fetch(`/api/live/streams?status=scheduled`),
      ]);
      const liveJson = (await liveRes.json()) as { streams?: StreamRow[] };
      const schedJson = (await schedRes.json()) as { streams?: StreamRow[] };
      let live = liveJson.streams ?? [];
      let up = schedJson.streams ?? [];
      if (verifiedOnly) {
        live = live.filter((s) => s.seller?.is_verified_live_seller);
        up = up.filter((s) => s.seller?.is_verified_live_seller);
      }
      setLiveRows(live);
      setUpcomingRows(up);
    } finally {
      setLoading(false);
    }
  }, [verifiedOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => void load(), 25_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Live selling
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Watch verified sellers stream products. Claim items during the live
            — checkout happens in chat, not in the app.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded border-zinc-300 text-brand focus:ring-brand"
          />
          Verified live sellers only
        </label>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          Live now
        </h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : liveRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
            No one is live right now. Check back soon or browse upcoming
            streams.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {liveRows.map((s) => (
              <StreamCard key={s.id} stream={s} live />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Upcoming
        </h2>
        {upcomingRows.length === 0 ? (
          <p className="text-sm text-zinc-500">No scheduled streams listed.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingRows.map((s) => (
              <StreamCard key={s.id} stream={s} live={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StreamCard({
  stream,
  live,
}: {
  stream: StreamRow;
  live: boolean;
}) {
  const seller = stream.seller;
  const initial = (seller?.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900",
        live
          ? "border-red-200/90 dark:border-red-900/50"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex gap-3 p-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          {seller?.avatar_url ? (
            <Image
              src={seller.avatar_url}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-500">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
              {seller?.name ?? "Seller"}
            </p>
            {seller?.is_verified_live_seller ? (
              <VerifiedLiveSellerBadge compact />
            ) : null}
            {live ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {stream.title}
          </p>
          {!live && stream.scheduled_start_at ? (
            <p className="mt-1 text-xs text-zinc-500">
              {new Date(stream.scheduled_start_at).toLocaleString("en-PH", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          {live ? (
            <p className="mt-1 text-xs tabular-nums text-zinc-500">
              ~{stream.viewer_count} viewers
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-auto border-t border-zinc-100 p-3 dark:border-zinc-800">
        {live ? (
          <Link
            href={`/live/${stream.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            <Radio className="h-4 w-4" />
            Watch live
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-400 dark:border-zinc-700"
          >
            Remind me (soon)
          </button>
        )}
      </div>
    </div>
  );
}
