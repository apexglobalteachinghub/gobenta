"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio, Video } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";
import type { LiveSellerApplicationRow } from "@/types/live-selling";
import { formatPhp } from "@/lib/format";

type ListingPick = { id: string; title: string; price: number };
type CategoryPick = { id: string; name: string };

type Props = {
  userId: string;
  isVerifiedLiveSeller: boolean;
  suspendedUntil: string | null;
  initialApplication: LiveSellerApplicationRow | null;
  activeStreamId: string | null;
  activeListings: ListingPick[];
  categories: CategoryPick[];
};

export function ProfileSellingLiveHub({
  userId,
  isVerifiedLiveSeller,
  suspendedUntil,
  initialApplication,
  activeStreamId,
  activeListings,
  categories,
}: Props) {
  const [application, setApplication] = useState(initialApplication);
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState<
    {
      id: string;
      listing_id: string;
      buyer_id: string;
      status: string;
      fulfilment: string;
      claimed_at: string;
    }[]
  >([]);

  const refreshApp = useCallback(async () => {
    const res = await fetch("/api/live/applications/me");
    const json = (await res.json()) as { application?: LiveSellerApplicationRow };
    setApplication(json.application ?? null);
  }, []);

  const loadClaims = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("live_claims")
      .select("id, listing_id, buyer_id, status, fulfilment, claimed_at")
      .eq("seller_id", userId)
      .order("claimed_at", { ascending: false })
      .limit(40);
    setClaims(data ?? []);
  }, [userId]);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const suspended =
    suspendedUntil && new Date(suspendedUntil).getTime() > Date.now();

  async function submitApplication(fd: FormData) {
    setBusy(true);
    const supabase = createClient();
    const file = fd.get("id_file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Upload a valid ID image");
      setBusy(false);
      return;
    }
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("live-seller-docs")
      .upload(path, file, { upsert: false });
    if (upErr) {
      toast.error(upErr.message);
      setBusy(false);
      return;
    }

    const category_labels = fd.getAll("category_labels").map(String);
    const sample_listing_ids = fd.getAll("sample_listing_ids").map(String);

    const res = await fetch("/api/live/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name: fd.get("store_name"),
        contact_phone: fd.get("contact_phone"),
        contact_email: fd.get("contact_email") || null,
        contact_messenger: fd.get("contact_messenger") || null,
        valid_id_storage_path: path,
        category_labels,
        sample_listing_ids,
        experience_text: fd.get("experience_text") || null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("Application submitted");
    await refreshApp();
  }

  async function startLive(fd: FormData) {
    setBusy(true);
    const title = String(fd.get("title") ?? "").trim();
    const playback_url = String(fd.get("playback_url") ?? "").trim();
    const listing_ids = fd.getAll("listing_ids").map(String);
    const res = await fetch("/api/live/streams/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        playback_url: playback_url || null,
        listing_ids,
        go_live_now: true,
      }),
    });
    const json = (await res.json()) as { error?: string; id?: string };
    setBusy(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("You are live!");
    if (json.id) {
      window.location.href = `/live/${json.id}`;
    }
  }

  async function patchFulfilment(
    claimId: string,
    fulfilment: "shipped" | "completed",
    courier: string,
    tracking: string
  ) {
    const res = await fetch(`/api/live/claims/${claimId}/fulfilment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fulfilment,
        courier: courier || null,
        tracking_number: tracking || null,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("Updated");
    void loadClaims();
  }

  return (
    <div className="space-y-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Live selling
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Executive-verified sellers can go live and sell via claims (buyers pay
          outside checkout).
        </p>
      </div>

      {isVerifiedLiveSeller ? (
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedLiveSellerBadge />
          {suspended ? (
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Suspended until{" "}
              {new Date(suspendedUntil!).toLocaleString("en-PH")}
            </span>
          ) : null}
        </div>
      ) : null}

      {!isVerifiedLiveSeller ? (
        <section className="space-y-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Apply as live seller
          </h3>
          {application ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Status:{" "}
              <strong className="capitalize text-zinc-900 dark:text-zinc-100">
                {application.status.replace(/_/g, " ")}
              </strong>
              {application.review_note ? (
                <>
                  {" "}
                  — {application.review_note}
                </>
              ) : null}
            </p>
          ) : null}
          {application?.status === "changes_requested" ||
          !application ||
          application.status === "rejected" ? (
            <form
              className="grid max-w-lg gap-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void submitApplication(new FormData(e.currentTarget));
              }}
            >
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Store name
                <input
                  name="store_name"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Phone
                <input
                  name="contact_phone"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Email (optional)
                <input
                  name="contact_email"
                  type="email"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Messenger / Viber (optional)
                <input
                  name="contact_messenger"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Valid ID (image)
                <input
                  name="id_file"
                  type="file"
                  accept="image/*"
                  required
                  className="mt-1 w-full text-xs"
                />
              </label>
              <fieldset>
                <legend className="font-medium text-zinc-700 dark:text-zinc-300">
                  Categories you sell
                </legend>
                <div className="mt-2 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        name="category_labels"
                        value={c.name}
                        className="rounded border-zinc-300 text-brand"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="font-medium text-zinc-700 dark:text-zinc-300">
                  Sample listings
                </legend>
                <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {activeListings.length === 0 ? (
                    <span className="text-zinc-500">List items first.</span>
                  ) : (
                    activeListings.map((l) => (
                      <label key={l.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="sample_listing_ids"
                          value={l.id}
                          className="rounded border-zinc-300 text-brand"
                        />
                        <span className="truncate">
                          {l.title} · {formatPhp(l.price)}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </fieldset>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Past live experience (optional)
                <textarea
                  name="experience_text"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit application"}
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {isVerifiedLiveSeller && !suspended ? (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
            <Video className="h-4 w-4" />
            Go live
          </h3>
          {activeStreamId ? (
            <Link
              href={`/live/${activeStreamId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Radio className="h-4 w-4" />
              Open active stream
            </Link>
          ) : (
            <form
              className="grid max-w-lg gap-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void startLive(new FormData(e.currentTarget));
              }}
            >
              <label className="font-medium text-zinc-700 dark:text-zinc-300">
                Stream title
                <input
                  name="title"
                  required
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <label className="font-medium text-zinc-700 dark:text-zinc-300">
                YouTube watch or embed URL (optional)
                <input
                  name="playback_url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <fieldset>
                <legend className="font-medium text-zinc-700 dark:text-zinc-300">
                  Products in this live
                </legend>
                <div className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto">
                  {activeListings.map((l) => (
                    <label key={l.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="listing_ids"
                        value={l.id}
                        className="rounded border-zinc-300 text-brand"
                      />
                      <span className="truncate">
                        {l.title} · {formatPhp(l.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4" />
                )}
                Start live now
              </button>
            </form>
          )}
        </section>
      ) : null}

      {isVerifiedLiveSeller ? (
        <section>
          <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
            Recent live claims
          </h3>
          {claims.length === 0 ? (
            <p className="text-sm text-zinc-500">No claims yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {claims.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <p className="font-mono text-xs text-zinc-500">{c.id}</p>
                  <p>
                    Listing{" "}
                    <Link
                      href={`/listing/${c.listing_id}`}
                      className="text-brand hover:underline"
                    >
                      {c.listing_id.slice(0, 8)}…
                    </Link>
                  </p>
                  <p className="capitalize">
                    {c.status} · {c.fulfilment}
                  </p>
                  {c.status === "confirmed" ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void patchFulfilment(
                            c.id,
                            "shipped",
                            prompt("Courier") ?? "",
                            prompt("Tracking #") ?? ""
                          )
                        }
                        className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium dark:bg-zinc-800"
                      >
                        Mark shipped
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void patchFulfilment(c.id, "completed", "", "")
                        }
                        className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50"
                      >
                        Completed
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
