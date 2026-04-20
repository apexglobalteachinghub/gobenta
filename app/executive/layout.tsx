import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive",
  robots: { index: false, follow: false },
};

export default function ExecutiveRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
