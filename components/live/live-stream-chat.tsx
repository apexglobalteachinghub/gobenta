"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type ChatMsg = {
  id: string;
  userId: string;
  name: string;
  text: string;
  ts: number;
};

type Props = {
  streamId: string;
  isLive: boolean;
  /** Display name for outgoing messages */
  senderName: string;
  senderId: string | null;
};

const MAX_LEN = 500;
const MAX_VISIBLE = 80;

/**
 * Ephemeral live chat via Supabase Realtime broadcast (no third-party).
 */
export function LiveStreamChat({
  streamId,
  isLive,
  senderName,
  senderId,
}: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isLive) {
      setMessages([]);
      setReady(false);
      channelRef.current = null;
      return;
    }

    const supabase = createClient();
    const ch = supabase.channel(`live-chat:${streamId}`, {
      config: { broadcast: { self: true } },
    });

    ch.on("broadcast", { event: "msg" }, ({ payload }) => {
      const p = payload as ChatMsg;
      if (!p?.id || !p.text) return;
      setMessages((m) => {
        const next = [...m, p];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channelRef.current = ch;
        setReady(true);
      }
    });

    return () => {
      setReady(false);
      channelRef.current = null;
      void supabase.removeChannel(ch);
    };
  }, [streamId, isLive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    if (!senderId) {
      toast.error("Log in to chat");
      return;
    }
    if (t.length > MAX_LEN) {
      toast.error(`Message too long (max ${MAX_LEN} characters)`);
      return;
    }

    const ch = channelRef.current;
    if (!ch) {
      toast.error("Chat not connected yet");
      return;
    }

    const res = await ch.send({
      type: "broadcast",
      event: "msg",
      payload: {
        id: crypto.randomUUID(),
        userId: senderId,
        name: senderName.slice(0, 80) || "User",
        text: t.slice(0, MAX_LEN),
        ts: Date.now(),
      } satisfies ChatMsg,
    });
    if (res !== "ok") {
      toast.error("Could not send message");
      return;
    }

    setText("");
  }

  if (!isLive) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Live chat
        </h3>
        <p className="text-xs text-zinc-500">
          Messages are live only and not saved after you leave.
        </p>
      </div>
      <div className="flex h-64 flex-col">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
          {!ready ? (
            <div className="flex justify-center py-8 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              No messages yet. Say hi!
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="rounded-lg bg-zinc-50 px-2 py-1.5 dark:bg-zinc-800/80"
              >
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {m.name}
                </span>
                <span className="ml-2 text-zinc-700 dark:text-zinc-300">
                  {m.text}
                </span>
              </div>
            ))
          )}
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
            placeholder={
              senderId ? "Message everyone watching…" : "Log in to chat"
            }
            disabled={!senderId}
            maxLength={MAX_LEN}
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!senderId || !text.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand px-3 py-2 text-white hover:bg-brand-hover disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
