"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getFacebookLoginScopes } from "@/lib/auth/facebook-oauth-scopes";
import { createClient } from "@/lib/supabase/client";
import { readAndClearSigninFlashClient } from "@/lib/auth/signin-flash-cookie";
import { FacebookIcon } from "@/components/auth/facebook-icon";
import { GoogleIcon } from "@/components/auth/google-icon";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/executive";
  if (!raw.startsWith("/executive")) return "/executive";
  return raw;
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

export function ExecutiveLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [facebookPending, setFacebookPending] = useState(false);
  const socialPending = googlePending || facebookPending;

  useEffect(() => {
    const flash = readAndClearSigninFlashClient();
    if (flash === "oauth") {
      toast.error(
        "Sign-in could not be finished. Check OAuth settings and try again."
      );
    } else if (flash === "missing_code") {
      toast.error("Sign-in session expired. Please try again.");
    }
  }, []);

  async function requireExecutiveOrBail(): Promise<boolean> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Could not verify your session.");
      return false;
    }
    const { data: row } = await supabase
      .from("users")
      .select("is_executive, banned_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!row?.is_executive) {
      await supabase.auth.signOut({ scope: "global" });
      toast.error("This login is reserved for executive accounts.");
      return false;
    }
    if (row.banned_at) {
      await supabase.auth.signOut({ scope: "global" });
      toast.error("This executive account is suspended.");
      return false;
    }
    return true;
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    setGooglePending(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
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
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
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
    const ok = await requireExecutiveOrBail();
    if (!ok) return;
    toast.success("Welcome");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mt-7 space-y-6">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          disabled={socialPending}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200/90 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:shadow-md disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => void signInWithFacebook()}
          disabled={socialPending}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200/90 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:shadow-md disabled:opacity-60"
        >
          <FacebookIcon className="h-5 w-5 shrink-0" />
          {facebookPending ? "Redirecting…" : "Continue with Facebook"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.14em]">
          <span className="bg-white px-3 text-zinc-400">Or email</span>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <label
            htmlFor="exec-email"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="exec-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="exec-password"
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Password
          </label>
          <input
            id="exec-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white shadow-sm shadow-brand/25 transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in to console"}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        Not listed on the public site.{" "}
        <Link
          href="/"
          className="font-semibold text-brand hover:text-brand-hover hover:underline"
        >
          Back to marketplace
        </Link>
      </p>
    </div>
  );
}
