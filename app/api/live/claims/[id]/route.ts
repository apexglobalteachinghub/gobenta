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

  let body: { confirm?: boolean; cancel?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: row, error: gErr } = await supabase
    .from("live_claims")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (gErr || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.confirm) {
    if (row.status !== "pending") {
      return NextResponse.json({ error: "Claim is not pending" }, { status: 400 });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from("live_claims").update({ status: "expired" }).eq("id", id);
      return NextResponse.json({ error: "Claim expired" }, { status: 400 });
    }
    const { error } = await supabase
      .from("live_claims")
      .update({
        status: "confirmed",
        fulfilment: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (body.cancel) {
    if (row.status !== "pending") {
      return NextResponse.json({ error: "Claim is not pending" }, { status: 400 });
    }
    const { error } = await supabase
      .from("live_claims")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "confirm or cancel required" }, { status: 400 });
}
