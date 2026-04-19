"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

function friendlyAuthMessage(
  code: string,
  rawDesc: string,
  fallbackError: string
): string {
  let decoded = rawDesc.replace(/\+/g, " ");
  try {
    decoded = decodeURIComponent(decoded);
    if (decoded.includes("%")) {
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        /* single decode enough */
      }
    }
  } catch {
    decoded = rawDesc;
  }

  const blob = `${code} ${decoded} ${fallbackError}`.toLowerCase();

  if (blob.includes("unable to exchange") || blob.includes("external code")) {
    return "Facebook sign-in failed on the server. Check App Secret and redirect URI in Meta and Supabase, then try again.";
  }
  if (code === "bad_oauth_callback" || blob.includes("state parameter")) {
    return "Sign-in session expired or was interrupted. Please try again.";
  }
  if (blob.includes("pkce") || blob.includes("code verifier")) {
    return "Sign-in session expired. Please try again.";
  }
  if (
    fallbackError === "missing_code" ||
    fallbackError === "oauth_failed" ||
    code === "unexpected_failure"
  ) {
    return "Sign-in could not be completed. Please try again.";
  }
  return "Sign-in could not be completed. Please try again.";
}

function stripAuthParams(sp: URLSearchParams) {
  ["error", "error_code", "error_description", "sb"].forEach((k) =>
    sp.delete(k)
  );
}

/**
 * Supabase/OAuth often adds ?error= or #error= (hash is never seen by the server).
 * Clean the address bar and show a short toast.
 */
export function AuthUrlErrorCleaner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let hashHandled = false;

    if (typeof window !== "undefined" && window.location.hash) {
      const rawHash = window.location.hash;
      // Facebook OAuth appends "#_=_" to the redirect URL; it is only visible client-side.
      if (rawHash === "#_=_" || rawHash.replace(/^#/, "") === "_=_") {
        window.history.replaceState(
          null,
          "",
          pathname + window.location.search
        );
      }
    }

    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, "");
      if (
        hash.includes("error=") ||
        hash.includes("error_code=") ||
        hash.includes("error_description=")
      ) {
        const spHash = new URLSearchParams(hash);
        const errCode = spHash.get("error_code") ?? "";
        const desc =
          spHash.get("error_description") ?? spHash.get("error") ?? "";
        const msg = friendlyAuthMessage(
          errCode,
          desc,
          spHash.get("error") ?? ""
        );
        toast.error(msg);
        window.history.replaceState(
          null,
          "",
          pathname + window.location.search
        );
        hashHandled = true;
      }
    }

    const sp = new URLSearchParams(searchParams.toString());
    const hasQueryAuthError =
      sp.has("error") ||
      sp.has("error_code") ||
      sp.has("error_description");
    if (!hasQueryAuthError) return;

    const errCode = sp.get("error_code") ?? "";
    const desc = (sp.get("error_description") ?? sp.get("error") ?? "")
      .replace(/\+/g, " ");
    const fallback = sp.get("error") ?? "";
    const message = friendlyAuthMessage(errCode, desc, fallback);

    if (!hashHandled) {
      toast.error(message);
    }

    stripAuthParams(sp);
    const qs = sp.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
