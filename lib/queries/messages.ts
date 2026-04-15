import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { MessageRow } from "@/types/database";

export type ThreadPreview = {
  listingId: string;
  peerId: string;
  peerName: string;
  listingTitle: string;
  lastMessage: string;
  lastAt: string;
};

/** Distinct conversation threads for the inbox (by listing + other user). */
export async function getThreadsForUser(
  userId: string
): Promise<ThreadPreview[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("messages")
    .select(
      `
      listing_id,
      sender_id,
      receiver_id,
      content,
      created_at,
      listings ( title )
    `
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !rows) {
    console.error("getThreadsForUser", error);
    return [];
  }

  const seen = new Set<string>();
  const threads: ThreadPreview[] = [];

  for (const row of rows as unknown as Array<{
    listing_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    listings: { title: string } | { title: string }[];
  }>) {
    const peerId =
      row.sender_id === userId ? row.receiver_id : row.sender_id;
    const key = `${row.listing_id}:${peerId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const listingTitle = Array.isArray(row.listings)
      ? row.listings[0]?.title
      : row.listings?.title;

    threads.push({
      listingId: row.listing_id,
      peerId,
      peerName: "",
      listingTitle: listingTitle ?? "Listing",
      lastMessage: row.content,
      lastAt: row.created_at,
    });
  }

  const peerIds = [...new Set(threads.map((t) => t.peerId))];
  if (peerIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", peerIds);
    const nameById = new Map((users ?? []).map((u) => [u.id, u.name]));
    for (const t of threads) {
      t.peerName = nameById.get(t.peerId) ?? "User";
    }
  }

  return threads;
}

export async function getMessagesForThread(
  listingId: string,
  userId: string,
  peerId: string
): Promise<MessageRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("getMessagesForThread", error);
    return [];
  }

  return (data as MessageRow[]).filter(
    (m) =>
      (m.sender_id === userId && m.receiver_id === peerId) ||
      (m.sender_id === peerId && m.receiver_id === userId)
  );
}
