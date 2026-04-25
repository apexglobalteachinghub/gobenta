import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Server-only Supabase client with service role (bypasses RLS). */
export function createServiceRoleClient() {
  const { url } = getSupabasePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set (Project Settings → API → service_role)."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
