"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Video, VideoOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

type SignalPayload =
  | { kind: "hello"; clientId: string }
  | {
      kind: "offer";
      clientId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: "answer";
      clientId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      kind: "ice";
      clientId: string;
      from: "seller" | "viewer";
      candidate: RTCIceCandidateInit;
    };

type SignalingChannel = {
  send: (args: {
    type: "broadcast";
    event: string;
    payload: SignalPayload;
  }) => Promise<unknown>;
};

function sendSignal(channel: SignalingChannel | null, payload: SignalPayload) {
  if (!channel) return;
  void channel.send({
    type: "broadcast",
    event: "signal",
    payload,
  });
}

type Props = {
  streamId: string;
  isSeller: boolean;
  /** Current user id (seller or viewer); used for logging only */
  userId: string | null;
  isLive: boolean;
};

/**
 * First-party live video: seller publishes camera+mic via WebRTC; viewers
 * subscribe (1 peer connection per viewer from the seller). Signaling uses
 * Supabase Realtime broadcast on a public channel (no YouTube/embed).
 */
export function LiveWebRtcStage({ streamId, isSeller, userId, isLive }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<SignalingChannel | null>(null);
  const clientIdRef = useRef(
    isSeller ? `seller-${userId ?? "host"}` : `viewer-${crypto.randomUUID()}`
  );
  /** Seller: one RTCPeerConnection per viewer clientId */
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const helloIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [channelReady, setChannelReady] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [remoteLive, setRemoteLive] = useState(false);
  const [connecting, setConnecting] = useState(!isSeller);

  const stopLocal = useCallback(() => {
    for (const pc of peersRef.current.values()) {
      pc.close();
    }
    peersRef.current.clear();
    if (viewerPcRef.current) {
      viewerPcRef.current.close();
      viewerPcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteLive(false);
  }, []);

  const ensureLocalMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      localStreamRef.current = stream;
      setMediaError(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Could not access camera or microphone.";
      setMediaError(msg);
      return null;
    }
  }, []);

  const handleSellerSignal = useCallback(
    async (payload: SignalPayload, stream: MediaStream) => {
      if (payload.kind === "hello") {
        const { clientId } = payload;
        if (clientId.startsWith("seller-")) return;

        let pc = peersRef.current.get(clientId);
        if (pc) {
          pc.close();
          peersRef.current.delete(clientId);
        }

        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peersRef.current.set(clientId, pc);

        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }

        pc.onicecandidate = (ev) => {
          if (ev.candidate && channelRef.current) {
            sendSignal(channelRef.current, {
              kind: "ice",
              clientId,
              from: "seller",
              candidate: ev.candidate.toJSON(),
            });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(channelRef.current, {
          kind: "offer",
          clientId,
          sdp: pc.localDescription!.toJSON(),
        });
        return;
      }

      if (payload.kind === "answer") {
        const pc = peersRef.current.get(payload.clientId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        return;
      }

      if (payload.kind === "ice" && payload.from === "viewer") {
        const pc = peersRef.current.get(payload.clientId);
        if (!pc || !payload.candidate) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          /* ignore */
        }
      }
    },
    []
  );

  const handleViewerSignal = useCallback(async (payload: SignalPayload) => {
    const myId = clientIdRef.current;

    if (payload.kind === "offer" && payload.clientId === myId) {
      setConnecting(true);
      if (viewerPcRef.current) {
        viewerPcRef.current.close();
        viewerPcRef.current = null;
      }

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      viewerPcRef.current = pc;

      pc.ontrack = (ev) => {
        const [remoteStream] = ev.streams;
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
          void remoteVideoRef.current.play().catch(() => {});
          setRemoteLive(true);
          setConnecting(false);
        }
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate && channelRef.current) {
          sendSignal(channelRef.current, {
            kind: "ice",
            clientId: myId,
            from: "viewer",
            candidate: ev.candidate.toJSON(),
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(channelRef.current, {
        kind: "answer",
        clientId: myId,
        sdp: pc.localDescription!.toJSON(),
      });
      return;
    }

    if (
      payload.kind === "ice" &&
      payload.from === "seller" &&
      payload.clientId === myId
    ) {
      const pc = viewerPcRef.current;
      if (!pc || !payload.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    if (!isLive) {
      stopLocal();
      return;
    }

    const supabase = createClient();
    const ch = supabase.channel(`live-webrtc:${streamId}`, {
      config: { broadcast: { self: true } },
    });

    ch.on("broadcast", { event: "signal" }, ({ payload }) => {
      const p = payload as SignalPayload;
      if (isSeller) {
        const stream = localStreamRef.current;
        if (stream) void handleSellerSignal(p, stream);
      } else {
        void handleViewerSignal(p);
      }
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channelRef.current = ch;
        setChannelReady(true);
      }
    });

    return () => {
      setChannelReady(false);
      channelRef.current = null;
      void supabase.removeChannel(ch);
      stopLocal();
    };
  }, [
    streamId,
    isLive,
    isSeller,
    handleSellerSignal,
    handleViewerSignal,
    stopLocal,
  ]);

  useEffect(() => {
    if (!isLive || !isSeller || !channelReady) return;

    let cancelled = false;
    (async () => {
      const stream = await ensureLocalMedia();
      if (cancelled || !stream) return;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLive, isSeller, channelReady, ensureLocalMedia]);

  useEffect(() => {
    if (!isLive || isSeller || !channelReady || !channelRef.current) return;

    const ch = channelRef.current;
    const tick = () => {
      sendSignal(ch, { kind: "hello", clientId: clientIdRef.current });
    };
    tick();
    helloIntervalRef.current = setInterval(tick, 2500);

    return () => {
      if (helloIntervalRef.current) {
        clearInterval(helloIntervalRef.current);
        helloIntervalRef.current = null;
      }
    };
  }, [isLive, isSeller, channelReady]);

  if (!isLive) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center bg-zinc-900 p-6 text-center text-sm text-zinc-400">
        Stream is not live.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[220px] flex-col gap-3 bg-black">
      {isSeller ? (
        <>
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
            <video
              ref={localVideoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
            {mediaError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-sm text-white">
                <VideoOff className="h-10 w-10 text-amber-300" />
                <p>{mediaError}</p>
                <p className="text-xs text-zinc-400">
                  Allow camera and microphone in your browser to broadcast on
                  GoBenta.
                </p>
              </div>
            ) : null}
          </div>
          <p className="px-3 pb-2 text-xs text-zinc-400">
            You are broadcasting with your camera. Viewers watch here — no
            YouTube or other embed required.
          </p>
        </>
      ) : (
        <>
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
            <video
              ref={remoteVideoRef}
              className="h-full w-full object-cover"
              playsInline
              autoPlay
              muted
            />
            {!remoteLive && !mediaError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900 p-4 text-center text-sm text-zinc-300">
                {connecting ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-brand" />
                    <p>Connecting to seller…</p>
                  </>
                ) : (
                  <>
                    <Video className="h-8 w-8 text-zinc-500" />
                    <p>Waiting for the seller to start their camera…</p>
                  </>
                )}
              </div>
            ) : null}
          </div>
          <p className="px-3 pb-2 text-xs text-zinc-500">
            Video is muted by default so playback can start automatically. Use
            your browser&apos;s unmute control on the video if you hear no sound.
          </p>
        </>
      )}
    </div>
  );
}
