import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeListings } from "@/components/home/home-listings";
import { ListingGridSkeleton } from "@/components/listing/listing-grid-skeleton";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ListingFilters } from "@/lib/queries/listings";

export const metadata: Metadata = {
  title: "Browse listings",
  description:
    "Buy and sell products, services, vehicles, property, jobs, and digital goods across the Philippines.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const categoryId = typeof sp.cat === "string" ? sp.cat : undefined;
  const subcategoryId = typeof sp.sub === "string" ? sp.sub : undefined;
  const minRaw = typeof sp.min === "string" ? Number(sp.min) : undefined;
  const maxRaw = typeof sp.max === "string" ? Number(sp.max) : undefined;
  const location = typeof sp.loc === "string" ? sp.loc : undefined;
  const province = typeof sp.province === "string" ? sp.province : undefined;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const barangay = typeof sp.brgy === "string" ? sp.brgy : undefined;
  const condition = typeof sp.cond === "string" ? sp.cond : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const filters: ListingFilters = {
    q,
    categoryId,
    subcategoryId,
    minPrice: minRaw !== undefined && !Number.isNaN(minRaw) ? minRaw : undefined,
    maxPrice: maxRaw !== undefined && !Number.isNaN(maxRaw) ? maxRaw : undefined,
    location,
    province,
    city,
    barangay,
    condition,
    tag,
  };

  const setupRedirect =
    typeof sp.supabase === "string" && sp.supabase === "missing";

  return (
    <div>
      {!isSupabaseConfigured() && (
        <div
          className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">Supabase is not configured</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            Copy <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">.env.example</code> to{" "}
            <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">.env.local</code> and set{" "}
            <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from your
            project&apos;s{" "}
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              className="font-medium underline"
              target="_blank"
              rel="noreferrer"
            >
              API settings
            </a>
            . Then restart <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/80">npm run dev</code>.
          </p>
          {setupRedirect && (
            <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
              Log in and seller tools require these variables.
            </p>
          )}
        </div>
      )}
      <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Today&apos;s picks
      </h1>
      <Suspense fallback={<ListingGridSkeleton />}>
        <HomeListings filters={filters} />
      </Suspense>
    </div>
  );
}
