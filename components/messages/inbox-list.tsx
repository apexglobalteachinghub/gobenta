import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import type { ThreadPreview } from "@/lib/queries/messages";

export function InboxList({ threads }: { threads: ThreadPreview[] }) {
  if (!threads.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <MessageCircle className="mb-2 h-10 w-10 text-zinc-400" />
        <p className="font-medium text-zinc-700 dark:text-zinc-200">
          No messages yet
        </p>
        <p className="mt-1 max-w-xs text-sm text-zinc-500">
          Open a listing and tap Message to chat with the seller.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {threads.map((t) => (
        <li key={`${t.listingId}-${t.peerId}`}>
          <Link
            href={`/messages/${t.listingId}/${t.peerId}`}
            className="block px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {t.peerName}
              </p>
              <span className="shrink-0 text-xs text-zinc-400">
                {formatRelativeTime(t.lastAt)}
              </span>
            </div>
            <p className="truncate text-xs text-zinc-500">{t.listingTitle}</p>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
              {t.lastMessage}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
