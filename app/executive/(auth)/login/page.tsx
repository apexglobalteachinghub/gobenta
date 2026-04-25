import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LayoutDashboard } from "lucide-react";
import { GobentaLogo } from "@/components/branding/gobenta-logo";
import { ExecutiveLoginForm } from "@/components/executive/executive-login-form";

export const metadata: Metadata = {
  title: "Executive sign in",
};

export default function ExecutiveLoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-surface/90 via-zinc-50 to-zinc-100 px-4 py-10 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-18%,rgba(46,125,50,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(245,124,0,0.06),transparent_45%)]" aria-hidden />

      <div className="relative mx-auto flex w-full max-w-[440px] flex-col items-center">
        <Link
          href="/"
          className="mb-7 outline-none ring-brand/25 focus-visible:rounded-lg focus-visible:ring-2"
          aria-label="GoBenta.ph home"
        >
          <GobentaLogo variant="hero" priority className="drop-shadow-sm" />
        </Link>

        <div className="w-full rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(46,125,50,0.18)]">
          <div className="flex gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-emerald-800 text-white shadow-md shadow-brand/25"
              aria-hidden
            >
              <LayoutDashboard className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                Executive console
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                Sign in
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-zinc-600">
            Internal tools for authorized GoBenta operators. Member accounts
            without executive access cannot use this page.
          </p>

          <Suspense fallback={null}>
            <ExecutiveLoginForm />
          </Suspense>

          <p className="mt-6 border-t border-zinc-100 pt-5 text-[11px] leading-relaxed text-zinc-400">
            Access is granted in Supabase when{" "}
            <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
              is_executive
            </code>{" "}
            is set on your profile row.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Wrong place?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:text-brand-hover hover:underline"
          >
            Member login
          </Link>
        </p>
      </div>
    </div>
  );
}
