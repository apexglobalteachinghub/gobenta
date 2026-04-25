import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GobentaLogo } from "@/components/branding/gobenta-logo";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center">
      <Link
        href="/"
        className="mb-8 outline-none ring-brand/20 focus-visible:rounded-lg focus-visible:ring-2"
        aria-label="GoBenta.ph home"
      >
        <GobentaLogo variant="hero" priority />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          ← Back to marketplace
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Register
        </h1>
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
