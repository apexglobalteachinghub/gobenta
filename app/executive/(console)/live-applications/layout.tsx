import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live applications",
};

export default function ExecutiveLiveAppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
