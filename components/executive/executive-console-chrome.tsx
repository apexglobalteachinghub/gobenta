"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Package,
  Radio,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/executive", label: "Dashboard", icon: LayoutDashboard },
  { href: "/executive/deals", label: "Deals & chat", icon: MessagesSquare },
  { href: "/executive/live-applications", label: "Live sellers", icon: Radio },
  { href: "/executive/customers", label: "Customers", icon: Users },
  { href: "/executive/listings", label: "Listings", icon: Package },
] as const;

export function ExecutiveConsoleChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    const supabase = createClient();
    const { error: globalErr } = await supabase.auth.signOut({
      scope: "global",
    });
    if (globalErr) {
      await supabase.auth.signOut({ scope: "local" });
    }
    toast.success("Signed out");
    router.push("/executive/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] dark:bg-zinc-950">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] dark:opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 20% 0%, rgba(46, 125, 50, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 80% 10%, rgba(245, 124, 0, 0.06) 0%, transparent 40%),
            linear-gradient(180deg, transparent 0%, transparent 100%)`,
        }}
      />
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-brand to-emerald-800 text-white shadow-md shadow-brand/25"
              )}
            >
              <LayoutDashboard className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                GoBenta.ph
              </p>
              <h1 className="truncate text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
                Executive console
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
              <span className="hidden sm:inline">Live site</span>
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1600px] flex-col md:flex-row">
        <aside className="hidden shrink-0 border-b border-zinc-200/80 bg-white/60 dark:border-zinc-800/80 dark:bg-zinc-950/40 md:block md:w-56 md:border-b-0 md:border-r">
          <nav className="sticky top-[57px] space-y-0.5 p-3 md:py-6">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/executive"
                  ? pathname === "/executive"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-zinc-200/80 bg-white/70 px-3 py-2 dark:border-zinc-800/80 dark:bg-zinc-950/50 md:hidden"
          aria-label="Executive sections"
        >
          {NAV.map(({ href, label }) => {
            const active =
              href === "/executive"
                ? pathname === "/executive"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="relative min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
