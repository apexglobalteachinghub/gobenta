import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeListingImageUrl } from "@/lib/images/listing-image-url";
import { publicStorageObjectPath } from "@/lib/executive/storage-path";

const BUCKET = "listing-images";

export async function reoptimizeListingImages(
  admin: SupabaseClient,
  listingId: string
): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  const { data: rows, error } = await admin
    .from("images")
    .select("id, image_url")
    .eq("listing_id", listingId)
    .order("sort_order");

  if (error) {
    return { processed: 0, errors: [error.message] };
  }
  if (!rows?.length) {
    return { processed: 0, errors: ["No images for this listing."] };
  }

  let processed = 0;

  for (const row of rows) {
    const idShort = row.id.replace(/-/g, "").slice(0, 12);
    try {
      const url = normalizeListingImageUrl(row.image_url);
      const oldPath = publicStorageObjectPath(url, BUCKET);
      if (!oldPath) {
        errors.push(`${row.id}: URL is not in bucket ${BUCKET}`);
        continue;
      }

      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) {
        errors.push(`${row.id}: download failed (${res.status})`);
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const dir = oldPath.includes("/")
        ? oldPath.slice(0, oldPath.lastIndexOf("/"))
        : "";

      let ext: "webp" | "jpg" = "webp";
      let out: Buffer;
      try {
        out = await sharp(buf)
          .rotate()
          .resize(1600, 1600, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        ext = "jpg";
        out = await sharp(buf)
          .rotate()
          .resize(1600, 1600, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
      }

      const newPath = dir
        ? `${dir}/reopt-${idShort}.${ext}`
        : `reopt-${idShort}.${ext}`;

      const { error: upErr } = await admin.storage.from(BUCKET).upload(
        newPath,
        out,
        {
          contentType: ext === "webp" ? "image/webp" : "image/jpeg",
          upsert: true,
        }
      );
      if (upErr) {
        errors.push(`${row.id}: upload failed (${upErr.message})`);
        continue;
      }

      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(newPath);
      const nextUrl = pub.publicUrl;

      const { error: dbErr } = await admin
        .from("images")
        .update({ image_url: nextUrl })
        .eq("id", row.id);
      if (dbErr) {
        errors.push(`${row.id}: DB update failed (${dbErr.message})`);
        continue;
      }

      if (oldPath !== newPath) {
        await admin.storage.from(BUCKET).remove([oldPath]);
      }

      processed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      errors.push(`${row.id}: ${msg}`);
    }
  }

  return { processed, errors };
}
