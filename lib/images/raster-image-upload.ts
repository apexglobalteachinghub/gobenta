/**
 * Client-only guards + resize/compress for user-supplied photos (listings, avatars).
 * Keeps storage and bandwidth predictable; blocks SVG and oversize inputs.
 *
 * Listing photos use a hard output ceiling so uploads cannot remain multi‑MB
 * even if the first WebP/JPEG pass is loose.
 */

export const LISTING_IMAGE_MAX_COUNT = 12;

/** Longest edge after the first compression pass (listing photos). */
export const LISTING_IMAGE_MAX_EDGE_PX = 1600;

/** Reject originals larger than this before decode (protects memory on phones). */
export const LISTING_IMAGE_MAX_INPUT_BYTES = 12 * 1024 * 1024; // 12 MB

/** Hard ceiling for stored listing image size (after all passes). */
export const LISTING_IMAGE_MAX_OUTPUT_BYTES = 1.15 * 1024 * 1024; // ~1.15 MB

export const AVATAR_IMAGE_MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8 MB

export const AVATAR_IMAGE_MAX_OUTPUT_BYTES = 380 * 1024; // ~380 KB

/** `accept` hint for file inputs (browser support varies for HEIC). */
export const RASTER_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export type RasterUploadRole = "listing" | "avatar";

const PRESETS: Record<
  RasterUploadRole,
  {
    maxWidthOrHeight: number;
    maxSizeMB: number;
    webpQuality: number;
    jpegQuality: number;
  }
> = {
  /** First pass: strong resize + target weight; budget pass may shrink further. */
  listing: {
    maxWidthOrHeight: LISTING_IMAGE_MAX_EDGE_PX,
    maxSizeMB: 0.85,
    webpQuality: 0.78,
    jpegQuality: 0.82,
  },
  avatar: {
    maxWidthOrHeight: 768,
    maxSizeMB: 0.38,
    webpQuality: 0.8,
    jpegQuality: 0.85,
  },
};

export type RasterValidateResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateRasterImageFile(
  file: File,
  opts: { maxBytes: number }
): RasterValidateResult {
  if (file.size <= 0) {
    return { ok: false, message: "Empty file." };
  }
  if (file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024));
    return {
      ok: false,
      message: `Each file must be under ${mb} MB.`,
    };
  }

  const rawType = file.type.toLowerCase().split(";")[0].trim();

  if (rawType === "image/svg+xml" || rawType === "image/svg") {
    return {
      ok: false,
      message: "SVG uploads are not allowed (security). Use JPG, PNG, or WebP.",
    };
  }

  if (!ALLOWED_MIME.has(rawType)) {
    return {
      ok: false,
      message: "Use JPG, PNG, WebP, GIF, or HEIC photos only.",
    };
  }

  return { ok: true };
}

function extensionForMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webp")) return "webp";
  if (m.includes("png")) return "png";
  return "jpg";
}

export function safeStorageFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function stemFromFileName(name: string): string {
  const s = name.replace(/\.[^.]+$/, "").trim();
  return (s || "photo").slice(0, 72);
}

/**
 * Extra JPEG passes until under cap (handles huge originals that stay large after one pass).
 */
async function enforceOutputBudget(
  file: File,
  role: RasterUploadRole
): Promise<File> {
  const cap =
    role === "listing"
      ? LISTING_IMAGE_MAX_OUTPUT_BYTES
      : AVATAR_IMAGE_MAX_OUTPUT_BYTES;
  if (file.size <= cap) return file;

  const imageCompression = (await import("browser-image-compression")).default;
  const preset = PRESETS[role];
  let current = file;
  const stem = stemFromFileName(file.name);

  for (let attempt = 0; attempt < 6 && current.size > cap; attempt++) {
    const minEdge = role === "listing" ? 720 : 256;
    const edge = Math.max(
      minEdge,
      Math.round(preset.maxWidthOrHeight * 0.92 ** (attempt + 1))
    );
    current = await imageCompression(current, {
      maxSizeMB: Math.max(0.22, cap / (1024 * 1024)),
      maxWidthOrHeight: edge,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: Math.max(0.52, preset.jpegQuality - attempt * 0.06),
      maxIteration: 20,
    });
  }

  const ext = extensionForMime(current.type);
  return new File([current], `${safeStorageFileName(stem)}.${ext}`, {
    type: current.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Resize (max edge) + re-encode for smaller storage. WebP first, JPEG fallback.
 * Then enforce LISTING_IMAGE_MAX_OUTPUT_BYTES / AVATAR_IMAGE_MAX_OUTPUT_BYTES.
 */
export async function processRasterImageForUpload(
  file: File,
  role: RasterUploadRole
): Promise<File> {
  const preset = PRESETS[role];
  const imageCompression = (await import("browser-image-compression")).default;

  const base = {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: preset.maxWidthOrHeight,
    useWebWorker: true,
    maxIteration: 14,
  } as const;

  let out: File;
  try {
    out = await imageCompression(file, {
      ...base,
      fileType: "image/webp",
      initialQuality: preset.webpQuality,
    });
  } catch {
    out = await imageCompression(file, {
      ...base,
      fileType: "image/jpeg",
      initialQuality: preset.jpegQuality,
    });
  }

  const ext = extensionForMime(out.type);
  const label = safeStorageFileName(stemFromFileName(file.name));
  let named = new File([out], `${label}.${ext}`, {
    type: out.type,
    lastModified: Date.now(),
  });

  named = await enforceOutputBudget(named, role);
  return named;
}
