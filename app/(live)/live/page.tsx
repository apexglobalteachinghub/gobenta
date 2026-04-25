import type { Metadata } from "next";
import { LiveDiscoveryClient } from "@/components/live/live-discovery-client";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Watch live sellers on GoBenta.ph — claim items in real time and arrange payment via chat.",
};

export default function LiveDiscoveryPage() {
  return <LiveDiscoveryClient />;
}
