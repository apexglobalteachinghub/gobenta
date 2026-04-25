import Link from "next/link";
import { VerifiedLiveSellerBadge } from "@/components/live/verified-live-seller-badge";
import type { LiveSellerApplicationRow } from "@/types/live-selling";

function statusLabel(status: LiveSellerApplicationRow["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "changes_requested":
      return "Changes requested";
    default:
      return status;
  }
}

type Props = {
  isVerifiedLiveSeller: boolean;
  suspendedUntil: string | null;
  application: LiveSellerApplicationRow | null;
};

export function ProfileLiveSellerStatus({
  isVerifiedLiveSeller,
  suspendedUntil,
  application,
}: Props) {
  const suspended =
    suspendedUntil && new Date(suspendedUntil).getTime() > Date.now();

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Live selling
      </p>
      {isVerifiedLiveSeller ? (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedLiveSellerBadge />
            {suspended ? (
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Suspended until{" "}
                {new Date(suspendedUntil!).toLocaleString("en-PH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            ) : (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                You can host live streams and sell via claims.
              </span>
            )}
          </div>
          {!suspended ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/profile/selling#go-live"
                className="inline-flex rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Go live
              </Link>
              <Link
                href="/live"
                className="inline-flex rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Watch live
              </Link>
              <Link
                href="/profile/selling"
                className="inline-flex rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Selling dashboard
              </Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Live selling is paused until the suspension ends. See{" "}
              <Link
                href="/profile/selling"
                className="font-medium text-brand hover:underline"
              >
                Selling
              </Link>{" "}
              for details.
            </p>
          )}
        </div>
      ) : application ? (
        <div className="mt-2 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Application status:{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {statusLabel(application.status)}
            </strong>
          </p>
          {application.review_note ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              Note: {application.review_note}
            </p>
          ) : null}
          <p className="pt-1 text-zinc-600 dark:text-zinc-400">
            Executive approval is required before you can go live. Update or
            resubmit from{" "}
            <Link
              href="/help/apply-live-seller"
              className="font-medium text-brand hover:underline"
            >
              Apply as Live Seller
            </Link>{" "}
            or{" "}
            <Link
              href="/profile/selling"
              className="font-medium text-brand hover:underline"
            >
              Selling
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <p>You are not enrolled as a live seller yet.</p>
          <Link
            href="/help/apply-live-seller"
            className="inline-flex rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Apply as Live Seller
          </Link>
        </div>
      )}
    </div>
  );
}
