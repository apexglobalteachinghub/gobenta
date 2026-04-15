import { getListings, type ListingFilters } from "@/lib/queries/listings";
import { ListingGrid } from "@/components/listing/listing-grid";

export async function HomeListings({ filters }: { filters: ListingFilters }) {
  const listings = await getListings(filters);
  return <ListingGrid listings={listings} />;
}
