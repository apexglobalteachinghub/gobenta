/** Returns embed URL for YouTube watch/share links, or null if not recognized. */
export function toYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== "string") return null;
  const u = url.trim();
  if (!u) return null;
  const embedMatch = u.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return `https://www.youtube.com/embed/${embedMatch[1]}`;
  }
  const watch = u.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return null;
}
