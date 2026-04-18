/** Meta (Facebook) Pixel ID — override with NEXT_PUBLIC_META_PIXEL_ID in env. */
export function getMetaPixelId(): string {
  return (
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "991596749960725"
  );
}
