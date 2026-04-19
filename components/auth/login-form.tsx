"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getFacebookLoginScopes } from "@/lib/auth/facebook-oauth-scopes";
import { createClient } from "@/lib/supabase/client";
import { clearPendingRoleCookieClient } from "@/lib/auth/pending-role-cookie";
import { FacebookIcon } from "@/components/auth/facebook-icon";
import { GoogleIcon } from "@/components/auth/google-icon";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [facebookPending, setFacebookPending] = useState(false);
  const socialPending = googlePending || facebookPending;

  useEffect(() => {
    clearPendingRoleCookieClient();
  }, []);

  async function signInWithGoogle() {
    const supabase = createClient();
    setGooglePending(true);
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setGooglePending(false);
    if (error) toast.error(error.message);
  }

  async function signInWithFacebook() {
    const supabase = createClient();
    setFacebookPending(true);
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo,
        scopes: getFacebookLoginScopes(),
      },
    });
    setFacebookPending(false);
    if (error) toast.error(error.message);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={socialPending}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <GoogleIcon className="h-5 w-5" />
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => void signInWithFacebook()}
          disabled={socialPending}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <FacebookIcon className="h-5 w-5 shrink-0" />
          {facebookPending ? "Redirecting…" : "Continue with Facebook"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900">
            Or use email
          </span>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-accent hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
