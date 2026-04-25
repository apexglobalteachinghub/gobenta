"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { normalizeListingImageUrl } from "@/lib/images/listing-image-url";
import { cn } from "@/lib/cn";

type Props = {
  userId: string;
  name: string;
  avatarUrl: string | null | undefined;
  sizePx: number;
  /** Wrap in link to public profile */
  linkToProfile?: boolean;
  className?: string;
  ringClassName?: string;
};

/**
 * Profile photo with the same resilience as the header menu: normalize storage
 * URLs and fall back to an initial letter if missing or broken.
 */
export function UserAvatarCircle({
  userId,
  name,
  avatarUrl,
  sizePx,
  linkToProfile = true,
  className,
  ringClassName,
}: Props) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim() || "?").slice(0, 1).toUpperCase();
  const raw = avatarUrl?.trim() ?? "";
  const src = raw && !broken ? normalizeListingImageUrl(raw) : null;

  const inner = !src ? (
    <span
      className={cn(
        "flex items-center justify-center rounded-full bg-brand font-bold text-white",
        className
      )}
      style={{ width: sizePx, height: sizePx, fontSize: Math.max(12, sizePx * 0.4) }}
    >
      {initial}
    </span>
  ) : (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        ringClassName,
        className
      )}
      style={{ width: sizePx, height: sizePx }}
    >
      <Image
        src={src}
        alt=""
        width={sizePx}
        height={sizePx}
        className="h-full w-full object-cover"
        unoptimized
        onError={() => setBroken(true)}
      />
    </span>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/u/${userId}`}
        className="inline-flex shrink-0 outline-none ring-brand/20 focus-visible:ring-2"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
