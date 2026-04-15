"use client";

import { Bell, MessageCircle, Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { UnreadMessagePreview } from "@/components/layout/use-inbox-unread";

function formatShortTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function truncate(s: string, max: number) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

type Props = {
  unreadCount: number;
  recentUnread: UnreadMessagePreview[];
};

export function NavNotificationBell({ unreadCount, recentUnread }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const bellBadge = unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={cn(
          "relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
          open && "bg-zinc-100 dark:bg-zinc-800"
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {bellBadge ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-zinc-950"
            aria-hidden
          >
            {bellBadge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,22rem)] origin-top-right rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Notifications
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Messages and activity related to your account
            </p>
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            <div className="px-2 py-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Messages
              </p>
              {recentUnread.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No new messages
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {recentUnread.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.threadHref}
                        onClick={() => setOpen(false)}
                        className="flex gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand dark:bg-emerald-950/60 dark:text-emerald-400">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              {n.peerName}
                            </span>
                            <span className="shrink-0 text-[11px] text-zinc-400">
                              {formatShortTime(n.created_at)}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="font-medium text-zinc-500 dark:text-zinc-400">
                              {truncate(n.listingTitle, 36)} ·{" "}
                            </span>
                            {truncate(n.content, 80)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/messages"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-lg px-2 py-2 text-center text-sm font-medium text-brand hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
              >
                Open all messages
              </Link>
            </div>

            <div className="border-t border-zinc-100 px-2 py-3 dark:border-zinc-800">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Listings &amp; orders
              </p>
              <div className="flex gap-2 rounded-lg px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                <Package className="h-5 w-5 shrink-0 opacity-60" />
                <span>
                  Alerts for sold listings, offers, and saved items will show
                  here as we add them.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
