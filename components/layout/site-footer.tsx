import Link from "next/link";
import { GobentaLogo } from "@/components/branding/gobenta-logo";

const legalLinks = [
  { href: "/terms", label: "Terms & conditions" },
  { href: "/marketplace-rules", label: "Marketplace rules" },
  { href: "/chat-ratings-reviews", label: "Chat, ratings & reviews" },
  { href: "/protect-yourself", label: "Protect yourself (scams)" },
] as const;

const helpLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
] as const;

const promotionLinks = [
  {
    href: "/promotions/win-trip-to-japan-for-2",
    label: "Win a trip to Japan for 2",
  },
] as const;

const navTitleClass =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const linkClass =
  "text-sm font-medium text-zinc-700 hover:text-brand hover:underline dark:text-zinc-300";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between md:gap-10">
          <div className="max-w-md shrink-0">
            <Link
              href="/"
              className="inline-flex leading-none outline-none ring-brand/20 transition hover:opacity-90 focus-visible:rounded-lg focus-visible:ring-2"
              aria-label="GoBenta.ph home"
            >
              <GobentaLogo variant="footer" />
            </Link>
            <p className="mt-2 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
              Philippines marketplace connecting buyers and sellers. Read our policies
              before you buy or sell.
            </p>
          </div>
          <div className="flex flex-wrap gap-10 sm:gap-14 lg:gap-20">
            <div>
              <h2 className={navTitleClass}>Help Center</h2>
              <nav aria-label="Help center" className="mt-3 flex flex-col gap-2">
                {helpLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h2 className={navTitleClass}>Promotions</h2>
              <nav aria-label="Promotions" className="mt-3 flex flex-col gap-2">
                {promotionLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <h2 className={navTitleClass}>Legal Notices</h2>
              <nav aria-label="Legal Notices" className="mt-3 flex flex-col gap-2">
                {legalLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <p className="mt-6 border-t border-zinc-100 pt-5 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          © {new Date().getFullYear()} GoBenta.ph. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
