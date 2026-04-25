import { createClient } from "@/lib/supabase/server";

export type ExecutiveSession = { userId: string };

export async function requireExecutiveApi(): Promise<
  ExecutiveSession | { json: { error: string }; status: number }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { json: { error: "Unauthorized" }, status: 401 };
  }

  const { data: row, error: rowErr } = await supabase
    .from("users")
    .select("is_executive, banned_at")
    .eq("id", user.id)
    .maybeSingle();

  if (rowErr || !row?.is_executive) {
    return { json: { error: "Forbidden" }, status: 403 };
  }
  if (row.banned_at) {
    return { json: { error: "Account suspended" }, status: 403 };
  }

  return { userId: user.id };
}
