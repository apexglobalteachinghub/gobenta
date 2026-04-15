import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Win a trip to Japan for 2",
  description:
    "Join the Gobenta.ph Japan Giveaway Promo — list, sell, and earn raffle entries. Draw November 15, 2026.",
};

export default function JapanTripPromoPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand dark:text-emerald-400">
          Promotions
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          ✨ WIN A TRIP TO JAPAN FOR TWO!
        </h1>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Turn your unused items into cash — and a chance to travel!
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Join the Gobenta.ph Japan Giveaway Promo and win an unforgettable trip
          to Japan 🇯🇵 for you and your companion.
        </p>
      </header>

      <LegalSection title="🎯 HOW TO JOIN">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Create an Account on Gobenta.ph</li>
          <li>List Your Items for sale</li>
          <li>Successfully Sell an Item</li>
          <li>Earn Entries Automatically!</li>
        </ol>
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          ✅ Every successful sale = 1 raffle entry
        </p>
      </LegalSection>

      <LegalSection title="🎟️ HOW TO WIN">
        <ul className="list-disc space-y-2 pl-5">
          <li>The more items you sell, the more chances of winning</li>
          <li>Each completed transaction counts as one entry</li>
          <li>No limit on entries — sell more, win more!</li>
        </ul>
      </LegalSection>

      <LegalSection title="🗓️ DRAW DATE">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          📅 November 15, 2026
        </p>
        <p className="mt-2">
          Winners will be announced on the Gobenta.ph platform and official
          social media pages.
        </p>
      </LegalSection>

      <LegalSection title="🏆 PRIZE DETAILS">
        <ul className="list-disc space-y-2 pl-5">
          <li>🎌 Round-trip travel to Japan for two (2) persons</li>
          <li>🏨 Accommodation included</li>
          <li>
            ✈️ Travel experience to be coordinated with the winner
          </li>
        </ul>
        <p className="mt-3 text-sm italic text-zinc-500 dark:text-zinc-400">
          (Specific travel dates and arrangements will be communicated after
          winner confirmation)
        </p>
      </LegalSection>

      <LegalSection title="⚠️ IMPORTANT REMINDERS">
        <ul className="list-disc space-y-2 pl-5">
          <li>Only completed and verified sales are counted</li>
          <li>
            Fake transactions or fraudulent activity will lead to
            disqualification
          </li>
          <li>
            Users must comply with Gobenta.ph policies and marketplace rules
          </li>
          <li>Winners must provide valid identification</li>
        </ul>
      </LegalSection>

      <LegalSection title="🔒 TRANSPARENCY & FAIR PLAY">
        <p>
          Gobenta.ph is committed to a fair and transparent raffle process. All
          entries will be validated before the official draw.
        </p>
      </LegalSection>

      <LegalSection title="📢 FINAL CALL">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          Don&apos;t miss your chance!
        </p>
        <p className="mt-2">
          Start selling today and turn your listings into a trip of a lifetime
          🇯🇵
        </p>
        <p className="mt-4">
          <Link
            href="/listing/new"
            className="font-semibold text-brand hover:underline dark:text-emerald-400"
          >
            List an item →
          </Link>
        </p>
      </LegalSection>
    </article>
  );
}
