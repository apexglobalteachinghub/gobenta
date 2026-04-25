import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deals & chat",
};

export default function ExecutiveDealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
