"use client";

import Image from "next/image";
import {
  Heart,
  LogOut,
  MessageCircle,
  Plus,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NavNotificationBell } from "@/components/layout/nav-notification-bell";
import { useInboxUnread } from "@/components/layout/use-inbox-unread";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

type Props = {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

function MenuAvatarChip({
  avatarUrl,
  initial,
}: {
  avatarUrl: string;
  initial: string;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
        {initial}
      </span>
    );
  }
  return (
    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
      <Image
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-cover"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

export function UserMenu({ userId, email, name, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inbox = useInboxUnread(userId);

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

  async function signOut() {
    const supabase = createClient();
    const { error: globalErr } = await supabase.auth.signOut({
      scope: "global",
    });
    if (globalErr) {
      await supabase.auth.signOut({ scope: "local" });
    }
    toast.success("Signed out");
    window.location.assign("/");
  }

  const label = name || email?.split("@")[0] || "Account";
  const initial = label.slice(0, 1).toUpperCase();

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800";

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <NavNotificationBell
        unreadCount={inbox.unreadCount}
        recentUnread={inbox.recentUnread}
      />
      <Link
        href="/saved"
        className="hidden rounded-full p-2 text-zinc-600 hover:bg-zinc-100 sm:block dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Saved"
      >
        <Heart className="h-5 w-5" />
      </Link>
      <Link
        href="/messages"
        className="relative hidden rounded-full p-2 text-zinc-600 hover:bg-zinc-100 sm:block dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Messages"
        aria-label={
          inbox.unreadCount > 0
            ? `Messages, ${inbox.unreadCount} unread`
            : "Messages"
        }
      >
        <MessageCircle className="h-5 w-5" />
        {inbox.unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white dark:ring-zinc-950"
            aria-hidden
          >
            {inbox.unreadCount > 99 ? "99+" : inbox.unreadCount}
          </span>
        ) : null}
      </Link>
      <Link
        href="/listing/new"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:ring-white/10 sm:h-9 sm:px-3.5"
        aria-label="Sell — list a new item"
      >
        <Plus className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.5} aria-hidden />
        Sell
      </Link>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            "flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
            avatarUrl ? "pr-1" : "max-w-[140px] px-2 py-1.5"
          )}
        >
          {avatarUrl ? (
            <MenuAvatarChip
              key={avatarUrl}
              avatarUrl={avatarUrl}
              initial={initial}
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {initial}
            </span>
          )}
          {!avatarUrl ? (
            <span className="truncate">{label}</span>
          ) : (
            <span className="sr-only">{label}</span>
          )}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <Link
              href="/profile"
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 shrink-0" />
              Profile & settings
            </Link>
            <Link
              href={`/u/${userId}`}
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4 shrink-0" />
              Public profile
            </Link>
            <Link
              href="/profile/selling"
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <Store className="h-4 w-4 shrink-0" />
              Selling
            </Link>
            <Link
              href="/profile/purchased"
              role="menuitem"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              Purchased
            </Link>
            <Link
              href="/saved"
              role="menuitem"
              className={cn(itemClass, "sm:hidden")}
              onClick={() => setOpen(false)}
            >
              <Heart className="h-4 w-4" /> Saved
            </Link>
            <Link
              href="/messages"
              role="menuitem"
              className={cn(itemClass, "justify-between sm:hidden")}
              onClick={() => setOpen(false)}
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0" /> Messages
              </span>
              {inbox.unreadCount > 0 ? (
                <span className="rounded-full bg-brand-accent px-2 py-0.5 text-[11px] font-bold text-white">
                  {inbox.unreadCount > 99 ? "99+" : inbox.unreadCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              role="menuitem"
              className={cn(
                itemClass,
                "text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              )}
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
