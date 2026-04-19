"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Supabase/OAuth often redirects with long ?error= / error_description= query strings.
 * Replace with a clean URL and a short user-facing toast (production-friendly).
 */
export function AuthUrlErrorCleaner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const hasAuthError =
      sp.has("error") ||
      sp.has("error_code") ||
      sp.has("error_description");
    if (!hasAuthError) {
      ran.current = false;
      return;
    }
    if (ran.current) return;
    ran.current = true;

    const code = sp.get("error_code") ?? "";
    const desc = (sp.get("error_description") ?? sp.get("error") ?? "")
      .replace(/\+/g, " ");
    let decoded = "";
    try {
      decoded = desc.length > 0 ? decodeURIComponent(desc) : "";
    } catch {
      decoded = desc;
    }

    let message = "Sign-in could not be completed. Please try again.";
    if (code === "bad_oauth_callback" || decoded.includes("state parameter")) {
      message = "Sign-in session expired or was interrupted. Please try again.";
    } else if (
      decoded.includes("PKCE") ||
      decoded.includes("code verifier")
    ) {
      message = "Sign-in session expired. Please try again.";
    } else if (sp.get("error") === "missing_code" || sp.get("error") === "oauth_failed") {
      message = "Sign-in could not be completed. Please try again.";
    }

    toast.error(message);

    ["error", "error_code", "error_description", "sb"].forEach((k) =>
      sp.delete(k)
    );
    const qs = sp.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
