import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { UserRow } from "@/types/database";

export async function getUserById(userId: string): Promise<UserRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, avatar_url, role, created_at, phone, address_public, government_id_type, government_id_last4, bio"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("getUserById", error.message);
    return null;
  }
  return data as unknown as UserRow;
}
