"use client";

import { useEffect } from "react";
import { markInboxSeen } from "@/lib/notifications/inbox-last-seen";

/** Marks the inbox as “seen” so message badges reset (same-tab + after refresh). */
export function InboxMarkSeen({ userId }: { userId: string }) {
  useEffect(() => {
    markInboxSeen(userId);
  }, [userId]);
  return null;
}
