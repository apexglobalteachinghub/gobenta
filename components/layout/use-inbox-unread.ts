"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ensureInboxLastOpenedBaseline,
  getInboxLastOpenedAt,
  INBOX_SEEN_EVENT,
} from "@/lib/notifications/inbox-last-seen";
import type { MessageRow } from "@/types/database";

export type UnreadMessagePreview = {
  id: string;
  content: string;
  created_at: string;
  listing_id: string;
  sender_id: string;
  peerName: string;
  listingTitle: string;
  threadHref: string;
};

export function useInboxUnread(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentUnread, setRecentUnread] = useState<UnreadMessagePreview[]>([]);

  const load = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      setUnreadCount(0);
      setRecentUnread([]);
      return;
    }

    ensureInboxLastOpenedBaseline(userId);
    const since = getInboxLastOpenedAt(userId);
    if (!since) {
      setUnreadCount(0);
      setRecentUnread([]);
      return;
    }

    try {
      const supabase = createClient();
      const { count, error: countErr } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .gt("created_at", since);

      if (countErr) {
        console.error("inbox unread count", countErr);
        setUnreadCount(0);
      } else {
        setUnreadCount(count ?? 0);
      }

      const { data: rows, error: listErr } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          created_at,
          listing_id,
          sender_id,
          listings ( title )
        `
        )
        .eq("receiver_id", userId)
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(8);

      if (listErr || !rows?.length) {
        if (listErr) console.error("inbox unread list", listErr);
        setRecentUnread([]);
        return;
      }

      const typed = rows as unknown as Array<
        Pick<MessageRow, "id" | "content" | "created_at" | "listing_id" | "sender_id"> & {
          listings: { title: string } | { title: string }[] | null;
        }
      >;

      const senderIds = [...new Set(typed.map((r) => r.sender_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, name")
        .in("id", senderIds);

      const nameById = new Map((users ?? []).map((u) => [u.id, u.name ?? "User"]));

      setRecentUnread(
        typed.map((r) => {
          const listingTitle = Array.isArray(r.listings)
            ? r.listings[0]?.title
            : r.listings?.title;
          return {
            id: r.id,
            content: r.content,
            created_at: r.created_at,
            listing_id: r.listing_id,
            sender_id: r.sender_id,
            peerName: nameById.get(r.sender_id) ?? "User",
            listingTitle: listingTitle ?? "Listing",
            threadHref: `/messages/${r.listing_id}/${r.sender_id}`,
          };
        })
      );
    } catch (e) {
      console.error("useInboxUnread", e);
      setUnreadCount(0);
      setRecentUnread([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    function onSeen() {
      void load();
    }
    window.addEventListener(INBOX_SEEN_EVENT, onSeen);
    return () => window.removeEventListener(INBOX_SEEN_EVENT, onSeen);
  }, [userId, load]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-unread:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.receiver_id !== userId) return;
          void load();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  return {
    unreadCount,
    recentUnread,
    refresh: load,
  };
}
