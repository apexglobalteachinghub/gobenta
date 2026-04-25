import { NextResponse } from "next/server";
import { normalizeListingImageUrl } from "@/lib/images/listing-image-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "live";
  const verifiedOnly = url.searchParams.get("verifiedOnly") === "1";

  if (!["live", "scheduled", "ended"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("live_streams")
      .select(
        `
        *,
        seller:users!live_streams_seller_id_fkey(id, name, avatar_url, is_verified_live_seller)
      `
      )
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Apply supabase/live_selling.sql" },
        { status: 503 }
      );
    }

    let rows = (data ?? []).map((r: Record<string, unknown>) => {
      const seller = r.seller as
        | {
            id: string;
            name: string;
            avatar_url: string | null;
            is_verified_live_seller?: boolean;
          }
        | null
        | undefined;
      if (!seller) return r;
      return {
        ...r,
        seller: {
          ...seller,
          avatar_url: seller.avatar_url
            ? normalizeListingImageUrl(seller.avatar_url)
            : null,
        },
      };
    });

    if (verifiedOnly) {
      rows = rows.filter((r: { seller?: { is_verified_live_seller?: boolean } }) =>
        Boolean(r.seller?.is_verified_live_seller)
      );
    }

    return NextResponse.json({ streams: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
