"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LiveSellerApplicationStatus } from "@/types/live-selling";

type Applicant = {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  live_buyer_claim_strikes?: number;
  live_seller_violation_count?: number;
  is_verified_live_seller?: boolean;
};

type Row = {
  id: string;
  user_id: string;
  store_name: string;
  contact_phone: string;
  contact_email: string | null;
  category_labels: string[];
  sample_listing_ids: string[];
  experience_text: string | null;
  status: LiveSellerApplicationStatus;
  review_note: string | null;
  internal_notes: string | null;
  created_at: string;
  applicant: Applicant | null;
};

const STATUSES: LiveSellerApplicationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "changes_requested",
];

export function ExecutiveLiveApplicationsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/executive/live-applications");
    const json = (await res.json()) as { applications?: Row[]; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Could not load");
      setRows([]);
    } else {
      setRows(json.applications ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePatch(
    id: string,
    status: LiveSellerApplicationStatus,
    review_note: string,
    internal_notes: string
  ) {
    const res = await fetch(`/api/executive/live-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, review_note, internal_notes }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Update failed");
      return;
    }
    toast.success("Saved");
    void load();
  }

  async function openIdDoc(id: string) {
    const res = await fetch(`/api/executive/live-applications/${id}/id-url`);
    const json = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "No document");
      return;
    }
    if (json.url) window.open(json.url, "_blank", "noopener,noreferrer");
  }

  async function enforce(
    userId: string,
    action: "warn" | "suspend" | "remove_badge",
    days?: number
  ) {
    const res = await fetch(`/api/executive/live-sellers/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, days }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("Updated seller");
    void load();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading applications…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Review ID documents (signed URL), listings sample, then approve or
        request changes. Service role key required for this API.
      </p>
      <div className="space-y-8">
        {rows.map((r) => (
          <ApplicationCard
            key={r.id}
            row={r}
            onSave={savePatch}
            onOpenId={() => void openIdDoc(r.id)}
            onEnforce={enforce}
          />
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No applications yet.</p>
      ) : null}
    </div>
  );
}

function ApplicationCard({
  row,
  onSave,
  onOpenId,
  onEnforce,
}: {
  row: Row;
  onSave: (
    id: string,
    s: LiveSellerApplicationStatus,
    note: string,
    internal: string
  ) => void;
  onOpenId: () => void;
  onEnforce: (
    userId: string,
    a: "warn" | "suspend" | "remove_badge",
    days?: number
  ) => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [review, setReview] = useState(row.review_note ?? "");
  const [internal, setInternal] = useState(row.internal_notes ?? "");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {row.store_name}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {row.applicant?.name} · {row.contact_phone}{" "}
            {row.contact_email ? `· ${row.contact_email}` : ""}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Buyer strikes: {row.applicant?.live_buyer_claim_strikes ?? 0} ·
            Seller violations: {row.applicant?.live_seller_violation_count ?? 0}{" "}
            · Verified:{" "}
            {row.applicant?.is_verified_live_seller ? "yes" : "no"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenId}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold dark:border-zinc-600"
        >
          View ID
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Categories: {row.category_labels.join(", ") || "—"}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Sample listing IDs: {row.sample_listing_ids.slice(0, 5).join(", ")}
        {row.sample_listing_ids.length > 5 ? "…" : ""}
      </p>
      {row.experience_text ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {row.experience_text}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Status
          </span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as LiveSellerApplicationStatus)
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Review note (visible to seller when rejected / changes)
          </span>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Internal notes (executive only)
          </span>
          <textarea
            value={internal}
            onChange={(e) => setInternal(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave(row.id, status, review, internal)}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
        >
          Save review
        </button>
        <button
          type="button"
          onClick={() => onEnforce(row.user_id, "warn")}
          className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:text-amber-100"
        >
          Warn seller
        </button>
        <button
          type="button"
          onClick={() => {
            const d = Number(prompt("Suspend days", "7"));
            if (!Number.isFinite(d)) return;
            onEnforce(row.user_id, "suspend", d);
          }}
          className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-800 dark:border-red-900 dark:text-red-200"
        >
          Suspend live
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm("Remove verified live seller badge?")) return;
            onEnforce(row.user_id, "remove_badge");
          }}
          className="rounded-xl border border-zinc-400 px-3 py-2 text-xs font-semibold"
        >
          Remove badge
        </button>
      </div>
    </div>
  );
}
