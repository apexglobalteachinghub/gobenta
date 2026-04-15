"use client";

import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/format";
import type { MessageRow } from "@/types/database";
import { cn } from "@/lib/cn";

type Props = {
  listingId: string;
  peerId: string;
  peerName: string;
  listingTitle: string;
  currentUserId: string;
  initialMessages: MessageRow[];
};

export function MessengerThread({
  listingId,
  peerId,
  peerName,
  listingTitle,
  currentUserId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const channelId = useMemo(
    () => `thread:${listingId}:${[currentUserId, peerId].sort().join(":")}`,
    [listingId, currentUserId, peerId]
  );

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.listing_id !== listingId) return;
          const inThread =
            (row.sender_id === currentUserId && row.receiver_id === peerId) ||
            (row.sender_id === peerId && row.receiver_id === currentUserId);
          if (!inThread) return;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelId, listingId, peerId, currentUserId]);

  async function send() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        listing_id: listingId,
        sender_id: currentUserId,
        receiver_id: peerId,
        content,
      })
      .select("*")
      .single();

    if (error) {
      console.error(error);
      toast.error("Message not sent");
    } else if (data) {
      setMessages((prev) => [...prev, data as MessageRow]);
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[420px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          {peerName}
        </p>
        <p className="truncate text-xs text-zinc-500">Re: {listingTitle}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/80 px-3 py-4 dark:bg-zinc-950/50">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Say hi — negotiate meet-up, ask for more photos, or confirm GCash /
            Maya details.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                  mine
                    ? "rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine ? "text-white/85" : "text-zinc-400"
                  )}
                >
                  {formatRelativeTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-brand dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
