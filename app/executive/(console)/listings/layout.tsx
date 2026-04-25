import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listings",
};

export default function ExecutiveListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
