"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";
import type { LiveSellerApplicationRow } from "@/types/live-selling";
import { formatPhp } from "@/lib/format";

export type LiveSellerCategoryPick = { id: string; name: string };
export type LiveSellerListingPick = { id: string; title: string; price: number };

type Props = {
  userId: string;
  categories: LiveSellerCategoryPick[];
  activeListings: LiveSellerListingPick[];
  initialApplication: LiveSellerApplicationRow | null;
  isVerifiedLiveSeller: boolean;
  /** Optional intro (e.g. help page policy copy). Rendered above status/form. */
  preamble?: React.ReactNode;
  /** Section title */
  title?: string;
};

export function LiveSellerApplicationPanel({
  userId,
  categories,
  activeListings,
  initialApplication,
  isVerifiedLiveSeller,
  preamble,
  title = "Apply as live seller",
}: Props) {
  const [application, setApplication] = useState(initialApplication);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setApplication(initialApplication);
  }, [initialApplication]);

  const refreshApp = useCallback(async () => {
    const res = await fetch("/api/live/applications/me");
    const json = (await res.json()) as { application?: LiveSellerApplicationRow };
    setApplication(json.application ?? null);
  }, []);

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

  if (isVerifiedLiveSeller) {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <div className="flex flex-wrap items-center gap-2">
          <VerifiedLiveSellerBadge />
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Your account is approved for live selling. Start or manage streams
          from your{" "}
          <Link href="/profile/selling" className="font-semibold text-brand hover:underline">
            Selling dashboard
          </Link>{" "}
          or visit the{" "}
          <Link href="/live" className="font-semibold text-brand hover:underline">
            Live hub
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preamble}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
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
                  <span className="text-zinc-500">
                    List at least one active item on GoBenta first, then select
                    it here as a sample.{" "}
                    <Link href="/listing/new" className="font-medium text-brand hover:underline">
                      Create a listing
                    </Link>
                  </span>
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
              Past live selling experience (optional)
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
        {application &&
        (application.status === "pending" ||
          application.status === "under_review") ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We&apos;ll email or message you if we need more information.
            Typical review takes a few business days.
          </p>
        ) : null}
      </section>
    </div>
  );
}
