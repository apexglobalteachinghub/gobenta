"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Records one row per pathname per browser session (sessionStorage) so
 * refreshes do not spam site_visits. Requires supabase/executive.sql policies.
 */
export function SiteVisitBeacon() {
  const pathname = usePathname();
  const loggedRef = useRef(false);

  useEffect(() => {
    loggedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured() || !pathname || loggedRef.current) return;
    const key = `gobenta_visit:${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* private mode */
    }

    loggedRef.current = true;
    const supabase = createClient();
    void supabase
      .from("site_visits")
      .insert({ path: pathname })
      .then(({ error }) => {
        if (!error) {
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            /* ignore */
          }
        }
      });
  }, [pathname]);

  return null;
}
