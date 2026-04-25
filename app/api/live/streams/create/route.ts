import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_verified_live_seller, live_seller_suspended_until")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_verified_live_seller) {
    return NextResponse.json(
      { error: "Only verified live sellers can start a stream" },
      { status: 403 }
    );
  }
  const susp = profile.live_seller_suspended_until
    ? new Date(profile.live_seller_suspended_until)
    : null;
  if (susp && susp.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Your live selling access is temporarily suspended" },
      { status: 403 }
    );
  }

  let body: {
    title?: string;
    description?: string;
    playback_url?: string | null;
    listing_ids?: string[];
    go_live_now?: boolean;
    scheduled_start_at?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const listing_ids = Array.isArray(body.listing_ids)
    ? body.listing_ids.map((x) => String(x)).filter(Boolean)
    : [];
  const go_live_now = Boolean(body.go_live_now);
  const scheduled_start_at = body.scheduled_start_at?.trim() || null;

  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  if (listing_ids.length > 0) {
    const { data: owned, error: oErr } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .is("transaction_completed_at", null)
      .in("id", listing_ids);
    if (oErr) {
      return NextResponse.json({ error: oErr.message }, { status: 500 });
    }
    if ((owned?.length ?? 0) !== listing_ids.length) {
      return NextResponse.json(
        { error: "All products must be your unsold listings" },
        { status: 400 }
      );
    }
  }

  const nowIso = new Date().toISOString();
  const status = go_live_now ? "live" : "scheduled";
  const started_at = go_live_now ? nowIso : null;

  const { data: stream, error: sErr } = await supabase
    .from("live_streams")
    .insert({
      seller_id: user.id,
      title,
      description,
      status,
      playback_url: body.playback_url?.trim() || null,
      scheduled_start_at: go_live_now ? null : scheduled_start_at,
      started_at,
      pinned_listing_id: listing_ids[0] ?? null,
    })
    .select("id")
    .single();

  if (sErr || !stream) {
    return NextResponse.json(
      { error: sErr?.message ?? "Could not create stream" },
      { status: 503 }
    );
  }

  if (listing_ids.length > 0) {
    const rows = listing_ids.map((listing_id, i) => ({
      stream_id: stream.id,
      listing_id,
      sort_order: i,
      slot_code: null,
    }));
    const { error: lErr } = await supabase.from("live_stream_listings").insert(rows);
    if (lErr) {
      await supabase.from("live_streams").delete().eq("id", stream.id);
      return NextResponse.json({ error: lErr.message }, { status: 503 });
    }
  }

  return NextResponse.json({ id: stream.id, status });
}
