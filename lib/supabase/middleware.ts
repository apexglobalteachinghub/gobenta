import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if ((path === "/login" || path === "/register") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
