/** Path inside a public bucket from a full Supabase public object URL. */
export function publicStorageObjectPath(
  imageUrl: string,
  bucket: string
): string | null {
  const trimmed = imageUrl.trim();
  const needle = `/storage/v1/object/public/${bucket}/`;
  const i = trimmed.indexOf(needle);
  if (i === -1) return null;
  const rest = trimmed.slice(i + needle.length).split("?")[0];
  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}
