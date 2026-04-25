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

  let body: {
    store_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_messenger?: string;
    valid_id_storage_path?: string;
    category_labels?: string[];
    sample_listing_ids?: string[];
    experience_text?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const store_name = String(body.store_name ?? "").trim();
  const contact_phone = String(body.contact_phone ?? "").trim();
  const contact_email = body.contact_email?.trim() || null;
  const contact_messenger = body.contact_messenger?.trim() || null;
  const valid_id_storage_path = String(body.valid_id_storage_path ?? "").trim();
  const category_labels = Array.isArray(body.category_labels)
    ? body.category_labels.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const sample_listing_ids = Array.isArray(body.sample_listing_ids)
    ? body.sample_listing_ids.map((x) => String(x)).filter(Boolean)
    : [];
  const experience_text = body.experience_text?.trim() || null;

  if (!store_name || !contact_phone || !valid_id_storage_path) {
    return NextResponse.json(
      { error: "store_name, contact_phone, and valid_id_storage_path required" },
      { status: 400 }
    );
  }

  const folder = valid_id_storage_path.split("/")[0];
  if (folder !== user.id) {
    return NextResponse.json(
      { error: "ID document must be uploaded under your account folder" },
      { status: 400 }
    );
  }

  if (sample_listing_ids.length > 0) {
    const { data: owned, error: oErr } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .in("id", sample_listing_ids);
    if (oErr) {
      return NextResponse.json({ error: oErr.message }, { status: 500 });
    }
    if ((owned?.length ?? 0) !== sample_listing_ids.length) {
      return NextResponse.json(
        { error: "Sample listings must be your own active listings" },
        { status: 400 }
      );
    }
  }

  const { data: pending } = await supabase
    .from("live_seller_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "under_review"])
    .maybeSingle();

  if (pending) {
    return NextResponse.json(
      { error: "You already have an application being reviewed" },
      { status: 409 }
    );
  }

  const { data: row, error } = await supabase
    .from("live_seller_applications")
    .insert({
      user_id: user.id,
      store_name,
      contact_phone,
      contact_email,
      contact_messenger,
      valid_id_storage_path,
      category_labels,
      sample_listing_ids,
      experience_text,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, hint: "Apply supabase/live_selling.sql" },
      { status: 503 }
    );
  }

  return NextResponse.json({ id: row.id });
}
