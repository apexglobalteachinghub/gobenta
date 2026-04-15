import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessengerThread } from "@/components/messages/messenger-thread";
import { getListingById } from "@/lib/queries/listings";
import { getMessagesForThread } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Conversation",
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ listingId: string; peerId: string }>;
}) {
  const { listingId, peerId } = await params;
  if (!UUID.test(listingId) || !UUID.test(peerId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (user.id === peerId) notFound();

  const [listing, messages, peerRow] = await Promise.all([
    getListingById(listingId),
    getMessagesForThread(listingId, user.id, peerId),
    supabase.from("users").select("name").eq("id", peerId).maybeSingle(),
  ]);

  if (!listing) notFound();

  return (
    <div className="max-w-3xl">
      <MessengerThread
        listingId={listingId}
        peerId={peerId}
        peerName={peerRow.data?.name ?? "User"}
        listingTitle={listing.title}
        currentUserId={user.id}
        initialMessages={messages}
      />
    </div>
  );
}
