import { createClient } from "@/lib/supabase/server";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** First name–style token for a short greeting (falls back to email local part). */
export async function getExecutiveDashboardGreeting(): Promise<{
  phrase: string;
  displayName: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const raw =
    row?.name?.trim() ||
    (typeof user.email === "string" ? user.email.split("@")[0] : "") ||
    "there";
  const displayName = raw.split(/\s+/)[0] || raw;

  const hour = Number(
    new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Manila",
    }).formatToParts(new Date()).find((p) => p.type === "hour")?.value ?? "12"
  );
  const phrase = greetingForHour(hour);

  return { phrase, displayName };
}
