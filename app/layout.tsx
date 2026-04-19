import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { MetaPixelPageView } from "@/components/analytics/meta-pixel-pageview";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { getMetaPixelId } from "@/lib/analytics/meta-pixel-id";
import { AuthUrlErrorCleaner } from "@/components/auth/auth-url-error-cleaner";
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
    title: "GoBenta.ph — Buy & sell everything",
    description:
      "Philippines marketplace — win up to ₱500,000, shop local deals, list your items. GCash, Maya, COD friendly.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GoBenta.ph — Win ₱500,000 giveaway, buy and sell on the marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoBenta.ph — Buy & sell everything",
    description:
      "Philippines marketplace — shop, sell, and join promos. Listings nationwide.",
    images: ["/og.png"],
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
  const metaPixelId = getMetaPixelId();

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
        <Script
          id="meta-pixel-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
            `.trim(),
          }}
        />
        <noscript>
          <img
            height={1}
            width={1}
            className="hidden"
            alt=""
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
        <AppProviders>
          <Suspense fallback={null}>
            <AuthUrlErrorCleaner />
          </Suspense>
          <Suspense fallback={null}>
            <MetaPixelPageView />
          </Suspense>
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
