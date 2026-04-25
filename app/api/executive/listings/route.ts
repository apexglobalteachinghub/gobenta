import { NextResponse } from "next/server";
import { requireExecutiveApi } from "@/lib/executive/require-executive-api";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const userId = (url.searchParams.get("userId") ?? "").trim();
  const limit = Math.min(
    100,
    Math.max(5, Number(url.searchParams.get("limit")) || 40)
  );

  try {
    const admin = createServiceRoleClient();
    let query = admin
      .from("listings")
      .select(
        "id, title, price, created_at, user_id, users!listings_user_id_fkey ( name )"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.ilike("title", `%${q}%`);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      listings: (data ?? []).map((row) => {
        const rel = row.users as unknown;
        const seller =
          Array.isArray(rel) && rel[0] && typeof rel[0] === "object"
            ? (rel[0] as { name?: string })
            : rel && typeof rel === "object"
              ? (rel as { name?: string })
              : null;
        return {
          id: row.id,
          title: row.title,
          price: row.price,
          created_at: row.created_at,
          user_id: row.user_id,
          seller_name: seller?.name ?? "",
        };
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
