import type { Metadata } from "next";
import { LiveWatchClient } from "@/components/live/live-watch-client";

type Props = { params: Promise<{ streamId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { streamId } = await params;
  return {
    title: "Live stream",
    robots: { index: false, follow: false },
    openGraph: { url: `/live/${streamId}` },
  };
}

export default async function LiveWatchPage({ params }: Props) {
  const { streamId } = await params;
  return <LiveWatchClient streamId={streamId} />;
}
