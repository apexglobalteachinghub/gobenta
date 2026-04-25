/**
 * Listing photos are stored as full Supabase Storage public URLs. Rows created
 * against a local Supabase (127.0.0.1:54321) break on production because browsers
 * resolve localhost on the visitor's device. Normalize at render/upload time.
 */
export const LISTING_IMAGE_PLACEHOLDER = "/placeholder-listing.svg";

function supabaseOriginFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/** True if the host clearly refers to this machine / dev Supabase. */
function isLoopbackOrDevStorageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h.endsWith(".local") ||
    h === "kong" ||
    h.startsWith("192.168.") ||
    h.startsWith("10.")
  );
}

/**
 * Rewrites dev/local storage URLs to the configured cloud project origin.
 * Safe to call on server or client (NEXT_PUBLIC_* is inlined).
 */
export function normalizeListingImageUrl(
  raw: string | null | undefined
): string {
  if (raw == null || typeof raw !== "string") return LISTING_IMAGE_PLACEHOLDER;
  const trimmed = raw.trim();
  if (!trimmed) return LISTING_IMAGE_PLACEHOLDER;

  // Relative path (legacy / mistaken)
  if (trimmed.startsWith("/storage/")) {
    const base = supabaseOriginFromEnv();
    return base ? `${base}${trimmed}` : LISTING_IMAGE_PLACEHOLDER;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return LISTING_IMAGE_PLACEHOLDER;
  }

  if (!parsed.pathname.includes("/storage/v1/")) {
    return trimmed;
  }

  const target = supabaseOriginFromEnv();
  if (
    target &&
    isLoopbackOrDevStorageHost(parsed.hostname) &&
    parsed.protocol !== "file:"
  ) {
    try {
      const o = new URL(target);
      return `${o.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/** Use when saving new rows so production DB stores cloud URLs when env is cloud. */
export function canonicalListingImagePublicUrl(publicUrl: string): string {
  return normalizeListingImageUrl(publicUrl);
}
