import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const site =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  title: {
    default: "GoBenta.ph — Buy & sell everything",
    template: "%s · GoBenta.ph",
  },
  description:
    "GoBenta.ph — Philippines marketplace for products, services, vehicles, property, jobs, and more. GCash, Maya, COD, and local-friendly listings.",
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "GoBenta.ph",
  },
  robots: { index: true, follow: true },
};

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storageOrigin = supabaseOrigin();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {storageOrigin ? (
          <>
            <link rel="preconnect" href={storageOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={storageOrigin} />
          </>
        ) : null}
      </head>
      <body
        className="min-h-full bg-zinc-50 font-sans text-base leading-normal text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50"
        suppressHydrationWarning
      >
        <AppProviders>
          <div className="flex min-h-full flex-col">
            <AnnouncementBar />
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
