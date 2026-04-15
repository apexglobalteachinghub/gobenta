import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatPhp } from "@/lib/format";
import type { ListingWithRelations } from "@/types/database";
import { PaymentBadges } from "@/components/listing/payment-badges";
import { StarDisplay } from "@/components/listing/star-display";
import { cn } from "@/lib/cn";

function pickImage(listing: ListingWithRelations) {
  const sorted = [...(listing.images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  return sorted[0]?.image_url ?? null;
}

type CardProps = {
  listing: ListingWithRelations;
  /** First viewport images: preload for faster LCP (home / key grids). */
  lcpImage?: boolean;
};

export function ListingCard({ listing, lcpImage = false }: CardProps) {
  const src = pickImage(listing);
  const sellerRating = listing.sellerRating ?? { avg: 0, count: 0 };
  const sold = !!listing.transaction_completed_at;
  const loc =
    [listing.barangay, listing.city, listing.location]
      .filter(Boolean)
      .join(" · ") || listing.location;

  const ukay =
    listing.subcategory?.name?.toLowerCase().includes("ukay") ||
    listing.tags?.some((t) => t.toLowerCase().includes("ukay"));

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
        {src ? (
          <Image
            src={src}
            alt={listing.title}
            fill
            priority={lcpImage}
            quality={72}
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <Image
            src="/placeholder-listing.svg"
            alt=""
            fill
            priority={lcpImage}
            quality={85}
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        )}
        {listing.pasabuy_available && (
          <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Pasabuy OK
          </span>
        )}
        {ukay && (
          <span
            className={cn(
              "absolute rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white",
              listing.pasabuy_available ? "left-2 top-10" : "left-2 top-2"
            )}
          >
            Ukay-ukay
          </span>
        )}
        {sold && (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Sold
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {formatPhp(Number(listing.price))}
        </p>
        <p className="line-clamp-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {listing.title}
        </p>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="max-w-[85%] truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {listing.seller?.name?.trim() || "Seller"}
            </span>
            <StarDisplay
              avg={sellerRating.avg}
              count={sellerRating.count}
              size="sm"
              emptyMode="minimal"
              className="shrink-0"
            />
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{loc}</span>
          </p>
        </div>
        <PaymentBadges options={listing.payment_options} />
      </div>
    </Link>
  );
}
