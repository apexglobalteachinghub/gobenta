import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Autocomplete: listing titles matching the query (global, not category-scoped). */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (raw.length < 1) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, title")
    .is("transaction_completed_at", null)
    .ilike("title", `%${raw}%`)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    return NextResponse.json([]);
  }

  const seen = new Set<string>();
  const out: { id: string; title: string }[] = [];
  for (const row of data ?? []) {
    const t = row.title.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push({ id: row.id, title: t });
    if (out.length >= 8) break;
  }

  return NextResponse.json(out);
}
