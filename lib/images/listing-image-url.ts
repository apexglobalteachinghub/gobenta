/**
 * Listing photos are stored as full Supabase Storage public URLs.
 *
 * Common production breakages (while localhost still "works"):
 * - image_url points at 127.0.0.1 / localhost (dev Supabase)
 * - http:// on *.supabase.co (mixed content blocked on https://gobenta.ph)
 * - wrong *.supabase.co project ref in the URL vs NEXT_PUBLIC_SUPABASE_URL
 * - relative /storage/... without origin
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

function envSupabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isSupabaseProjectHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h.endsWith(".supabase.co") || h.endsWith(".supabase.in");
}

function isLoopbackOrDevStorageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    h === "::1" ||
    h.endsWith(".local") ||
    h === "kong" ||
    h.startsWith("192.168.") ||
    h.startsWith("10.")
  );
}

function isPublicStoragePath(pathname: string): boolean {
  return pathname.includes("/storage/v1/object/public/");
}

/**
 * Rewrites storage URLs to match this deployment's Supabase project and https.
 */
export function normalizeListingImageUrl(
  raw: string | null | undefined
): string {
  if (raw == null || typeof raw !== "string") return LISTING_IMAGE_PLACEHOLDER;
  const trimmed = raw.trim();
  if (!trimmed) return LISTING_IMAGE_PLACEHOLDER;

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

  const envOrigin = supabaseOriginFromEnv();
  const envHost = envSupabaseHostname();

  if (
    isSupabaseProjectHost(parsed.hostname) &&
    parsed.protocol === "http:" &&
    !parsed.port
  ) {
    parsed.protocol = "https:";
  }

  if (!parsed.pathname.includes("/storage/v1/")) {
    return parsed.toString();
  }

  if (envOrigin && envHost && isPublicStoragePath(parsed.pathname)) {
    const h = parsed.hostname.toLowerCase();
    if (isLoopbackOrDevStorageHost(h)) {
      return `${envOrigin}${parsed.pathname}${parsed.search}`;
    }
  }

  return parsed.toString();
}

export function canonicalListingImagePublicUrl(publicUrl: string): string {
  return normalizeListingImageUrl(publicUrl);
}
