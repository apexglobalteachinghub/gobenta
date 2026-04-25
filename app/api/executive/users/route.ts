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
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.min(
    100,
    Math.max(10, Number(url.searchParams.get("perPage")) || 30)
  );

  try {
    const admin = createServiceRoleClient();
    const { data: listData, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ids = listData.users.map((u) => u.id);
    const { data: profiles } = await admin
      .from("users")
      .select("id, name, role, banned_at, is_executive, created_at")
      .in("id", ids);

    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p])
    );

    return NextResponse.json({
      page,
      perPage,
      total: listData.total ?? listData.users.length,
      users: listData.users.map((u) => {
        const p = profileById.get(u.id);
        return {
          id: u.id,
          email: u.email,
          last_sign_in_at: u.last_sign_in_at,
          created_at: u.created_at,
          name: p?.name ?? "",
          role: p?.role ?? "buyer",
          banned_at: p?.banned_at ?? null,
          is_executive: p?.is_executive ?? false,
          profile_created_at: p?.created_at ?? null,
        };
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  let body: {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const role =
    body.role === "seller" || body.role === "buyer" ? body.role : "buyer";

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  try {
    const admin = createServiceRoleClient();
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split("@")[0],
          role,
        },
      });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message ?? "Could not create user" },
        { status: 400 }
      );
    }

    const uid = created.user.id;
    await admin
      .from("users")
      .update({
        name: name || email.split("@")[0],
        role,
      })
      .eq("id", uid);

    return NextResponse.json({
      id: uid,
      email: created.user.email,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
