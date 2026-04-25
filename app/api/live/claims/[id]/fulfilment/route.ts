import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

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
    fulfilment?: string;
    courier?: string | null;
    tracking_number?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fulfilment = body.fulfilment;
  if (fulfilment !== "shipped" && fulfilment !== "completed") {
    return NextResponse.json(
      { error: "fulfilment must be shipped or completed" },
      { status: 400 }
    );
  }

  const { data: row, error: gErr } = await supabase
    .from("live_claims")
    .select("seller_id, status, fulfilment")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.status !== "confirmed") {
    return NextResponse.json(
      { error: "Claim must be confirmed by buyer first" },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { fulfilment };
  if (body.courier !== undefined) patch.courier = body.courier?.trim() || null;
  if (body.tracking_number !== undefined) {
    patch.tracking_number = body.tracking_number?.trim() || null;
  }

  const { error } = await supabase.from("live_claims").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
