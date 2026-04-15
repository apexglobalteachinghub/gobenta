import Link from "next/link";
import { Suspense } from "react";
import { GobentaLogo } from "@/components/branding/gobenta-logo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/layout/search-bar";
import { AuthLinks, UserMenu } from "@/components/layout/user-menu";

export async function Navbar() {
  let user: { id: string; email?: string | null } | null = null;
  let profileName: string | null = null;
  let avatarUrl: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u ? { id: u.id, email: u.email } : null;
    if (u) {
      const { data: row } = await supabase
        .from("users")
        .select("name, avatar_url")
        .eq("id", u.id)
        .maybeSingle();
      profileName = row?.name ?? null;
      avatarUrl = row?.avatar_url ?? null;
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
            />
          ) : (
            <AuthLinks />
          )}
        </div>
      </div>
    </header>
  );
}
