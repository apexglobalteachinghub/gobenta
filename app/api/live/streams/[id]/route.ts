import { NextResponse } from "next/server";
import { normalizeListingImageUrl } from "@/lib/images/listing-image-url";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: stream, error: sErr } = await supabase
    .from("live_streams")
    .select(
      `
      *,
      seller:users!live_streams_seller_id_fkey(id, name, avatar_url, is_verified_live_seller)
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 503 });
  }
  if (!stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const streamRow = stream as Record<string, unknown> & {
    seller?: {
      id: string;
      name: string;
      avatar_url: string | null;
      is_verified_live_seller?: boolean;
    } | null;
  };
  const streamOut = {
    ...streamRow,
    seller: streamRow.seller
      ? {
          ...streamRow.seller,
          avatar_url: streamRow.seller.avatar_url
            ? normalizeListingImageUrl(streamRow.seller.avatar_url)
            : null,
        }
      : streamRow.seller,
  };

  const { data: links, error: pErr } = await supabase
    .from("live_stream_listings")
    .select("listing_id, slot_code, sort_order")
    .eq("stream_id", id)
    .order("sort_order", { ascending: true });

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 503 });
  }

  const listingIds = (links ?? []).map((l) => l.listing_id);
  let listingsById: Record<
    string,
    {
      id: string;
      title: string;
      price: number;
      user_id: string;
      images: { id: string; image_url: string; sort_order: number }[];
    }
  > = {};

  if (listingIds.length > 0) {
    const { data: listings, error: lErr } = await supabase
      .from("listings")
      .select(
        `
        id, title, price, user_id,
        images(id, image_url, sort_order)
      `
      )
      .in("id", listingIds);

    if (lErr) {
      return NextResponse.json({ error: lErr.message }, { status: 503 });
    }
    for (const row of listings ?? []) {
      const r = row as {
        id: string;
        title: string;
        price: number;
        user_id: string;
        images:
          | { id: string; image_url: string; sort_order: number }
          | { id: string; image_url: string; sort_order: number }[]
          | null;
      };
      const rawImages = r.images;
      const imageRows = Array.isArray(rawImages)
        ? rawImages
        : rawImages
          ? [rawImages]
          : [];
      listingsById[r.id] = {
        id: r.id,
        title: r.title,
        price: Number(r.price),
        user_id: r.user_id,
        images: imageRows.map((img) => ({
          ...img,
          image_url: normalizeListingImageUrl(img.image_url),
        })),
      };
    }
  }

  const products = (links ?? []).map((link) => ({
    listing_id: link.listing_id,
    slot_code: link.slot_code,
    sort_order: link.sort_order,
    listing: listingsById[link.listing_id] ?? null,
  }));

  const { data: claims } = await supabase
    .from("live_claims")
    .select(
      "id, listing_id, buyer_id, status, fulfilment, claimed_at, expires_at, slot_code"
    )
    .eq("stream_id", id)
    .order("claimed_at", { ascending: false });

  return NextResponse.json({
    stream: streamOut,
    products: products ?? [],
    claims: claims ?? [],
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    action?: string;
    pinned_listing_id?: string | null;
    title?: string;
    description?: string;
    playback_url?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: stream, error: gErr } = await supabase
    .from("live_streams")
    .select("seller_id, status")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (stream.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.action === "end") {
    const { error } = await supabase
      .from("live_streams")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = {};
  if (body.pinned_listing_id !== undefined) {
    patch.pinned_listing_id = body.pinned_listing_id;
  }
  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.description !== undefined) {
    patch.description = String(body.description).trim();
  }
  if (body.playback_url !== undefined) {
    patch.playback_url = body.playback_url?.trim() || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { error } = await supabase.from("live_streams").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
