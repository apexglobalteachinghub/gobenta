import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
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

  const { id: targetId } = await ctx.params;
  if (!targetId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: { banned?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.banned !== "boolean") {
    return NextResponse.json({ error: "banned boolean required" }, { status: 400 });
  }

  if (targetId === auth.userId) {
    return NextResponse.json(
      { error: "You cannot change your own ban state here" },
      { status: 400 }
    );
  }

  try {
    const admin = createServiceRoleClient();
    const { data: target, error: tErr } = await admin
      .from("users")
      .select("is_executive")
      .eq("id", targetId)
      .maybeSingle();

    if (tErr || !target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.is_executive && body.banned) {
      return NextResponse.json(
        { error: "Executive accounts cannot be banned via this control" },
        { status: 400 }
      );
    }

    const banned_at = body.banned ? new Date().toISOString() : null;
    const { error: uErr } = await admin
      .from("users")
      .update({ banned_at })
      .eq("id", targetId);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, banned_at });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteParams) {
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

  const { id: targetId } = await ctx.params;
  if (!targetId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (targetId === auth.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account from the console" },
      { status: 400 }
    );
  }

  try {
    const admin = createServiceRoleClient();
    const { data: target, error: tErr } = await admin
      .from("users")
      .select("is_executive")
      .eq("id", targetId)
      .maybeSingle();

    if (tErr || !target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.is_executive) {
      return NextResponse.json(
        { error: "Executive accounts cannot be deleted from the console" },
        { status: 400 }
      );
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
