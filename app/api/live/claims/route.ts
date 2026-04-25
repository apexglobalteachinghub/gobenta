import { NextResponse } from "next/server";
import { LIVE_CLAIM_EXPIRY_SECONDS } from "@/lib/live/constants";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { stream_id?: string; listing_id?: string; slot_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const stream_id = String(body.stream_id ?? "");
  const listing_id = String(body.listing_id ?? "");
  const slot_code = body.slot_code?.trim() || null;

  if (!stream_id || !listing_id) {
    return NextResponse.json(
      { error: "stream_id and listing_id required" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  const { error: expErr } = await supabase
    .from("live_claims")
    .update({ status: "expired" })
    .eq("stream_id", stream_id)
    .eq("listing_id", listing_id)
    .eq("status", "pending")
    .lt("expires_at", nowIso);

  if (expErr) {
    return NextResponse.json({ error: expErr.message }, { status: 500 });
  }

  const { data: active } = await supabase
    .from("live_claims")
    .select("id, expires_at")
    .eq("stream_id", stream_id)
    .eq("listing_id", listing_id)
    .eq("status", "pending")
    .maybeSingle();

  if (active && new Date(active.expires_at).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "This item is already claimed. Try again when the timer expires." },
      { status: 409 }
    );
  }

  const { data: stream, error: sErr } = await supabase
    .from("live_streams")
    .select("seller_id, status, title")
    .eq("id", stream_id)
    .maybeSingle();

  if (sErr || !stream) {
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  }
  if (stream.status !== "live") {
    return NextResponse.json(
      { error: "Claims are only open during a live stream" },
      { status: 400 }
    );
  }
  if (stream.seller_id === user.id) {
    return NextResponse.json({ error: "You cannot claim your own listing" }, { status: 400 });
  }

  const { data: link } = await supabase
    .from("live_stream_listings")
    .select("listing_id")
    .eq("stream_id", stream_id)
    .eq("listing_id", listing_id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json(
      { error: "This product is not offered in this stream" },
      { status: 400 }
    );
  }

  const { data: listing, error: lErr } = await supabase
    .from("listings")
    .select("id, title, user_id")
    .eq("id", listing_id)
    .maybeSingle();

  if (lErr || !listing || listing.user_id !== stream.seller_id) {
    return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  }

  const expires_at = new Date(
    Date.now() + LIVE_CLAIM_EXPIRY_SECONDS * 1000
  ).toISOString();

  const { data: claim, error: cErr } = await supabase
    .from("live_claims")
    .insert({
      stream_id,
      listing_id,
      buyer_id: user.id,
      seller_id: stream.seller_id,
      slot_code,
      status: "pending",
      fulfilment: "unconfirmed",
      expires_at,
    })
    .select("id")
    .single();

  if (cErr) {
    if (cErr.code === "23505") {
      return NextResponse.json(
        { error: "This item was just claimed. Please try again." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }

  const msg = `[Live] I claimed “${listing.title}” in your live stream. Please confirm my order. (Claim expires soon — check Live claims.)`;

  const { error: mErr } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: stream.seller_id,
    listing_id,
    content: msg,
  });

  if (mErr) {
    console.error("live claim message", mErr);
  }

  return NextResponse.json({ id: claim.id, expires_at });
}
