import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div
      role="region"
      aria-label="Promotional announcement"
      className="relative z-50 border-b border-emerald-200/70 bg-gradient-to-r from-emerald-50/95 via-white to-amber-50/90 dark:border-emerald-900/50 dark:from-emerald-950/90 dark:via-zinc-900 dark:to-amber-950/30"
    >
      <div className="mx-auto flex max-w-[1600px] justify-center px-3 py-2.5 sm:px-4 sm:py-3">
        <p className="max-w-4xl text-center text-[0.8125rem] font-medium leading-relaxed tracking-tight text-zinc-800 sm:text-sm dark:text-zinc-100">
          <span className="text-balance">✈️ Win a Trip to Japan for 2! 🇯🇵</span>{" "}
          <Link
            href="/listing/new"
            className="font-semibold text-brand underline decoration-brand/25 underline-offset-[3px] transition hover:decoration-brand/60 hover:text-brand-hover dark:text-emerald-400 dark:decoration-emerald-400/35 dark:hover:text-emerald-300 dark:hover:decoration-emerald-300/60"
          >
            List &amp; sell on Gobenta.ph
          </Link>{" "}
          <span className="text-zinc-600 dark:text-zinc-400">
            — Promo ends{" "}
            <time dateTime="2026-11-15" className="font-semibold text-zinc-800 dark:text-zinc-200">
              Nov 15, 2026
            </time>
            !
          </span>
        </p>
      </div>
    </div>
  );
}
