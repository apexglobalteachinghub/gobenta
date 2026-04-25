import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export async function GET() {
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

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("live_seller_applications")
      .select(
        `
        *,
        applicant:users!live_seller_applications_user_id_fkey(
          id, name, avatar_url, created_at, live_buyer_claim_strikes, live_seller_violation_count, is_verified_live_seller
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { error: error.message, hint: "Apply supabase/live_selling.sql" },
        { status: 503 }
      );
    }

    return NextResponse.json({ applications: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
