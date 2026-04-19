import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabasePublicEnv,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { PENDING_ROLE_COOKIE } from "@/lib/auth/pending-role-cookie";
import type { UserRole } from "@/types/database";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { url: supabaseUrl, anonKey } = getSupabasePublicEnv();
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthErr = searchParams.get("error");
  const oauthDesc = searchParams.get("error_description");

  if (!code) {
    if (oauthErr || oauthDesc) {
      return NextResponse.redirect(
        new URL("/login?error=oauth_failed", request.url)
      );
    }
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }

  const pending = request.cookies.get(PENDING_ROLE_COOKIE)?.value;
  const role: UserRole | null =
    pending === "buyer" || pending === "seller" ? pending : null;

  if (role) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").update({ role }).eq("id", user.id);
    }
    response.cookies.set(PENDING_ROLE_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
