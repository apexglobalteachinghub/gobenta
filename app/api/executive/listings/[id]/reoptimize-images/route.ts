import { NextResponse } from "next/server";
import { reoptimizeListingImages } from "@/lib/executive/reoptimize-listing-images";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: RouteParams) {
  const auth = await requireExecutiveApi();
  if ("json" in auth) {
    return NextResponse.json(auth.json, { status: auth.status });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 503 }
    );
  }

  const { id: listingId } = await ctx.params;
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing id" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id")
      .eq("id", listingId)
      .maybeSingle();

    if (lErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const result = await reoptimizeListingImages(admin, listingId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
