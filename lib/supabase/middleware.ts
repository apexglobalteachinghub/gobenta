import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/lib/supabase/env";

const PROTECTED_PREFIXES = [
  "/listing/new",
  "/messages",
  "/profile",
  "/saved",
];

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // OAuth return: must not run getUser()/session refresh here. That calls setAll
  // and can clear or reorder Supabase auth cookies before the route handler runs
  // exchangeCodeForSession — leading to bad_oauth_callback / "OAuth state parameter missing".
  if (path === "/auth/callback") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  // Without env vars, @supabase/ssr throws — skip session and avoid protected routes.
  if (!isSupabaseConfigured()) {
    if (needsAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("supabase", "missing");
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  const { url: supabaseUrl, anonKey } = getSupabasePublicEnv();

  const supabase = createServerClient(supabaseUrl, anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isExecutiveLogin = path === "/executive/login";
  const isExecutiveArea = path.startsWith("/executive");

  if (isExecutiveArea) {
    if (isExecutiveLogin) {
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("is_executive")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.is_executive) {
          const url = request.nextUrl.clone();
          url.pathname = "/executive";
          url.search = "";
          return NextResponse.redirect(url);
        }
      }
      return supabaseResponse;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/executive/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_executive")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_executive) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      url.searchParams.set("executive", "denied");
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if ((path === "/login" || path === "/register") && user && !isExecutiveLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
