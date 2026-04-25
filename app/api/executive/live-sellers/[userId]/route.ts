import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
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

  const { userId } = await ctx.params;
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  let body: {
    action?: string;
    days?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "warn" && action !== "suspend" && action !== "remove_badge") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();

    if (action === "remove_badge") {
      const { error } = await admin
        .from("users")
        .update({ is_verified_live_seller: false })
        .eq("id", userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "suspend") {
      const days = Math.min(90, Math.max(1, Number(body.days) || 7));
      const until = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await admin
        .from("users")
        .update({ live_seller_suspended_until: until })
        .eq("id", userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, live_seller_suspended_until: until });
    }

    const { data: row } = await admin
      .from("users")
      .select("live_seller_violation_count")
      .eq("id", userId)
      .maybeSingle();

    const next = (row?.live_seller_violation_count ?? 0) + 1;
    const { error } = await admin
      .from("users")
      .update({ live_seller_violation_count: next })
      .eq("id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, live_seller_violation_count: next });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
