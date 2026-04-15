"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

export function ListingGallery({
  images,
  title,
}: {
  images: { id: string; image_url: string; sort_order: number }[];
  title: string;
}) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [idx, setIdx] = useState(0);
  const main = sorted[idx]?.image_url ?? "/placeholder-listing.svg";

  if (!sorted.length) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <Image src="/placeholder-listing.svg" alt="" fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={main}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950",
                i === idx ? "ring-brand" : "ring-transparent"
              )}
            >
              <Image
                src={im.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
