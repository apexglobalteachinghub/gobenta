import type { Metadata } from "next";
import { InboxMarkSeen } from "@/components/messages/inbox-mark-seen";
import { InboxList } from "@/components/messages/inbox-list";
import { getThreadsForUser } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const threads = await getThreadsForUser(user.id);

  return (
    <div className="max-w-lg">
      <InboxMarkSeen userId={user.id} />
      <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Messages
      </h1>
      <InboxList threads={threads} />
    </div>
  );
}
