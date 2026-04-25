import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

const VALID = new Set([
  "pending",
  "under_review",
  "approved",
  "rejected",
  "changes_requested",
]);

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

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: {
    status?: string;
    review_note?: string | null;
    internal_notes?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const admin = createServiceRoleClient();
    const { data: app, error: gErr } = await admin
      .from("live_seller_applications")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (gErr || !app) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.userId,
    };
    if (body.review_note !== undefined) patch.review_note = body.review_note;
    if (body.internal_notes !== undefined) {
      patch.internal_notes = body.internal_notes;
    }

    const { error: uErr } = await admin
      .from("live_seller_applications")
      .update(patch)
      .eq("id", id);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    if (status === "approved") {
      await admin
        .from("users")
        .update({ is_verified_live_seller: true })
        .eq("id", app.user_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
