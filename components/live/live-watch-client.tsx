"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";
import { LIVE_CLAIM_EXPIRY_SECONDS } from "@/lib/live/constants";
import { toYoutubeEmbedUrl } from "@/lib/live/youtube-embed";
import { formatPhp } from "@/lib/format";
import { normalizeListingImageUrl } from "@/lib/images/listing-image-url";
import { cn } from "@/lib/cn";

type StreamPayload = {
  stream: {
    id: string;
    seller_id: string;
    title: string;
    description: string;
    status: string;
    playback_url: string | null;
    pinned_listing_id: string | null;
    seller: {
      id: string;
      name: string;
      avatar_url: string | null;
      is_verified_live_seller?: boolean;
    } | null;
  };
  products: {
    listing_id: string;
    slot_code: string | null;
    listing: {
      id: string;
      title: string;
      price: number;
      images: { image_url: string; sort_order: number }[];
    } | null;
  }[];
  claims: {
    id: string;
    listing_id: string;
    buyer_id: string;
    status: string;
    fulfilment: string;
    expires_at: string;
    slot_code: string | null;
  }[];
};

export function LiveWatchClient({ streamId }: { streamId: string }) {
  const [data, setData] = useState<StreamPayload | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimBusy, setClaimBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/live/streams/${streamId}`);
    const json = (await res.json()) as StreamPayload & { error?: string };
    if (!res.ok) {
      setData(null);
      return;
    }
    setData(json as StreamPayload);
  }, [streamId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setMe(user?.id ?? null);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`live-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_claims",
          filter: `stream_id=eq.${streamId}`,
        },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [streamId, load]);

  async function claim(listingId: string) {
    if (!me) {
      toast.error("Log in to claim");
      return;
    }
    setClaimBusy(listingId);
    const res = await fetch("/api/live/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stream_id: streamId, listing_id: listingId }),
    });
    const json = (await res.json()) as { error?: string; expires_at?: string };
    setClaimBusy(null);
    if (!res.ok) {
      toast.error(json.error ?? "Could not claim");
      return;
    }
    toast.success(`Claimed — confirm within ${LIVE_CLAIM_EXPIRY_SECONDS / 60} min`);
    await load();
  }

  async function confirmClaim(claimId: string) {
    const res = await fetch(`/api/live/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("Order confirmed with seller");
    await load();
  }

  async function endLive() {
    const res = await fetch(`/api/live/streams/${streamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    if (!res.ok) {
      toast.error("Could not end stream");
      return;
    }
    toast.success("Stream ended");
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  if (!data?.stream) {
    return (
      <p className="py-16 text-center text-zinc-500">
        This stream is unavailable or has ended.
      </p>
    );
  }

  const { stream, products, claims } = data;
  const embed = toYoutubeEmbedUrl(stream.playback_url);
  const isSeller = me === stream.seller_id;
  const nowMs = Date.now();
  const activePending = claims.filter(
    (c) =>
      c.status === "pending" && new Date(c.expires_at).getTime() > nowMs
  );
  const claimByListing = new Map(
    activePending.map((c) => [c.listing_id, c] as const)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/live"
            className="text-sm font-medium text-brand hover:underline"
          >
            ← All live streams
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {stream.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {stream.status === "live" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white">
                <Radio className="h-3 w-3" />
                Live
              </span>
            ) : null}
            {stream.seller?.is_verified_live_seller ? (
              <VerifiedLiveSellerBadge compact />
            ) : null}
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {stream.seller?.name}
            </span>
          </div>
        </div>
        {isSeller && stream.status === "live" ? (
          <button
            type="button"
            onClick={() => void endLive()}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            End live
          </button>
        ) : null}
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 bg-black dark:border-zinc-800">
        {embed ? (
          <iframe
            title="Live stream"
            src={`${embed}?rel=0`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-white">
            <p className="text-sm text-zinc-300">
              No embed URL yet. The seller may still be setting up — product
              claims work below.
            </p>
            {stream.playback_url ? (
              <a
                href={stream.playback_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand-accent underline"
              >
                Open stream link
              </a>
            ) : null}
          </div>
        )}
      </div>

      {stream.description ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {stream.description}
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Products
        </h2>
        <ul className="space-y-3">
          {products.map((p) => {
            const L = p.listing;
            if (!L) return null;
            const img = [...(L.images ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order
            )[0];
            const src = img
              ? normalizeListingImageUrl(img.image_url)
              : "/placeholder-listing.svg";
            const c = claimByListing.get(L.id);
            const timerActive =
              c?.status === "pending" &&
              new Date(c.expires_at).getTime() > Date.now();
            const pendingMine = timerActive && c?.buyer_id === me;

            return (
              <li
                key={L.id}
                className={cn(
                  "flex gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900",
                  stream.pinned_listing_id === L.id && "ring-2 ring-brand/40"
                )}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/listing/${L.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {L.title}
                  </Link>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatPhp(L.price)}
                  </p>
                  {p.slot_code ? (
                    <p className="text-xs text-zinc-500">Slot {p.slot_code}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!isSeller && stream.status === "live" && !timerActive ? (
                      <button
                        type="button"
                        disabled={claimBusy === L.id}
                        onClick={() => void claim(L.id)}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                      >
                        {claimBusy === L.id ? "Claiming…" : "Claim"}
                      </button>
                    ) : null}
                    {timerActive && !pendingMine ? (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                        Claimed by another buyer
                      </span>
                    ) : null}
                    {timerActive && pendingMine ? (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                        Your claim — confirm below
                      </span>
                    ) : null}
                    {pendingMine ? (
                      <button
                        type="button"
                        onClick={() => void confirmClaim(c!.id)}
                        className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        Confirm order
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
