import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
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

  try {
    const admin = createServiceRoleClient();
    const { data: app, error: gErr } = await admin
      .from("live_seller_applications")
      .select("valid_id_storage_path")
      .eq("id", id)
      .maybeSingle();

    if (gErr || !app?.valid_id_storage_path) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: signed, error: sErr } = await admin.storage
      .from("live-seller-docs")
      .createSignedUrl(app.valid_id_storage_path, 3600);

    if (sErr || !signed?.signedUrl) {
      return NextResponse.json(
        { error: sErr?.message ?? "Could not sign URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
