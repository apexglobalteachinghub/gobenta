"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PENDING_ROLE_COOKIE } from "@/lib/auth/pending-role-cookie";
import type { UserRole } from "@/types/database";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Finishes OAuth (PKCE) in the browser so exchangeCodeForSession sees the same
 * cookie storage as signInWithOAuth. Server route handlers often fail with
 * bad_oauth_callback / "OAuth state parameter missing" even when middleware
 * skips session refresh.
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      const code = params.get("code");
      const next = safeNextPath(params.get("next"));
      const oauthError = params.get("error");
      const oauthDesc = params.get("error_description");

      if (oauthError) {
        router.replace(
          `/login?error=${encodeURIComponent(oauthDesc ?? oauthError)}`,
        );
        return;
      }

      if (!code) {
        router.replace("/login?error=missing_code");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        return;
      }

      const pending = getCookie(PENDING_ROLE_COOKIE);
      const role: UserRole | null =
        pending === "buyer" || pending === "seller" ? pending : null;

      if (role) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("users").update({ role }).eq("id", user.id);
        }
        document.cookie = `${PENDING_ROLE_COOKIE}=; Path=/; Max-Age=0`;
      }

      router.replace(next);
      router.refresh();
    };

    void run();
  }, [params, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Signing you in…
      </p>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Please wait while we complete your login.
      </p>
    </div>
  );
}
