import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { GobentaLogo } from "@/components/branding/gobenta-logo";
import { AuthLinks } from "@/components/layout/auth-links";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const SearchBar = dynamic(() =>
  import("@/components/layout/search-bar").then((m) => m.SearchBar)
);

const UserMenu = dynamic(
  () => import("@/components/layout/user-menu").then((m) => m.UserMenu),
  {
    loading: () => (
      <div
        className="flex h-9 items-center gap-2"
        aria-busy="true"
        aria-label="Loading account menu"
      >
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <span className="hidden h-9 w-24 shrink-0 animate-pulse rounded-full bg-zinc-200 sm:block dark:bg-zinc-700" />
      </div>
    ),
  }
);

export async function Navbar() {
  let user: { id: string; email?: string | null } | null = null;
  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let isVerifiedLiveSeller = false;
  let liveSellerSuspendedUntil: string | null = null;
  let activeLiveStreamId: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u ? { id: u.id, email: u.email } : null;
    if (u) {
      const { data: row } = await supabase
        .from("users")
        .select(
          "name, avatar_url, is_verified_live_seller, live_seller_suspended_until"
        )
        .eq("id", u.id)
        .maybeSingle();
      profileName = row?.name ?? null;
      avatarUrl = row?.avatar_url ?? null;
      isVerifiedLiveSeller = Boolean(row?.is_verified_live_seller);
      liveSellerSuspendedUntil = row?.live_seller_suspended_until ?? null;

      if (isVerifiedLiveSeller) {
        const { data: stream } = await supabase
          .from("live_streams")
          .select("id")
          .eq("seller_id", u.id)
          .eq("status", "live")
          .maybeSingle();
        activeLiveStreamId = stream?.id ?? null;
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-2 sm:px-4 sm:py-2.5">
        <Link
          href="/"
          className="flex shrink-0 items-center rounded-lg leading-none outline-none ring-brand/30 transition hover:opacity-90 focus-visible:ring-2"
          aria-label="GoBenta.ph home"
        >
          <GobentaLogo priority />
        </Link>
        <div className="order-3 w-full min-w-0 sm:order-none sm:ml-1 sm:mr-2 sm:max-w-xl sm:flex-1">
          <Suspense fallback={<div className="h-11 rounded-full bg-zinc-100 dark:bg-zinc-800" />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu
              userId={user.id}
              email={user.email ?? null}
              name={profileName}
              avatarUrl={avatarUrl}
              isVerifiedLiveSeller={isVerifiedLiveSeller}
              liveSellerSuspendedUntil={liveSellerSuspendedUntil}
              activeLiveStreamId={activeLiveStreamId}
            />
          ) : (
            <AuthLinks />
          )}
        </div>
      </div>
    </header>
  );
}
