import { createClient } from "@/lib/supabase/server";
import type { ExecutiveDashboardPayload } from "@/types/executive-dashboard";

export async function fetchExecutiveDashboard(): Promise<
  ExecutiveDashboardPayload | null
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_executive_dashboard");
  if (error || !data || typeof data !== "object") {
    return null;
  }
  return data as unknown as ExecutiveDashboardPayload;
}
