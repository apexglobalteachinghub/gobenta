import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GobentaLogo } from "@/components/branding/gobenta-logo";
import { ExecutiveLoginForm } from "@/components/executive/executive-login-form";

export const metadata: Metadata = {
  title: "Executive sign in",
};

export default function ExecutiveLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center">
        <Link
          href="/"
          className="mb-8 outline-none ring-white/20 focus-visible:rounded-lg focus-visible:ring-2"
          aria-label="GoBenta.ph home"
        >
          <GobentaLogo variant="hero" priority className="brightness-0 invert" />
        </Link>
        <div className="w-full rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-8 shadow-xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Restricted
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Executive sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Use the account that was promoted in Supabase (
            <code className="rounded bg-zinc-800 px-1 text-xs">is_executive</code>
            ).
          </p>
          <Suspense fallback={null}>
            <ExecutiveLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
