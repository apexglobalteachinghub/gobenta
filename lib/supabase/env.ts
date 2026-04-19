/** True when public Supabase env vars are set (trimmed, non-empty). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Project Settings → API in Supabase)."
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Use the Project URL from Supabase → Settings → API."
    );
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be the project base only (e.g. https://abcd.supabase.co), not the OAuth callback. Remove /auth/v1/callback from this value."
    );
  }

  return { url: parsed.origin, anonKey };
}
