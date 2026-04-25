"use client";

import Image from "next/image";
import { useState } from "react";
import { LISTING_IMAGE_PLACEHOLDER } from "@/lib/images/listing-image-url";

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
};

/**
 * Listing photos: load directly from Storage (no Vercel optimizer) and fall back
 * to the placeholder if the URL 404s — matches typical localhost &lt;img&gt; behavior.
 */
export function ListingPhotoFill({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: Props) {
  const [broken, setBroken] = useState(false);

  const effective =
    broken || src === LISTING_IMAGE_PLACEHOLDER
      ? LISTING_IMAGE_PLACEHOLDER
      : src;

  return (
    <Image
      src={effective}
      alt={broken || effective === LISTING_IMAGE_PLACEHOLDER ? "" : alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
      onError={() => {
        if (!broken) setBroken(true);
      }}
    />
  );
}
