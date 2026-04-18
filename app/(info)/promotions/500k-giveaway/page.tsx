import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/legal/legal-section";

const P = "\u20B1";

export const metadata: Metadata = {
  title: `Win ${P}500,000 giveaway`,
  description: `How to win ${P}500,000 on GoBenta.ph — follow, share, buy or sell, and earn raffle entries. Draw November 15, 2026.`,
};

export default function Giveaway500kPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand dark:text-emerald-400">
          Promotions
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          {"\u{1F389}"} How to Win {P}500,000 on GoBenta.ph
        </h1>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {"\u{1F4B0}"} Turn Your Transactions Into Chances to Win!
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Joining the GoBenta.ph {P}500,000 Giveaway is simple — no complicated
          steps, no hidden fees. All you need to do is buy or sell on GoBenta.ph,
          follow, and share — and you&apos;re in!
        </p>
      </header>

      <LegalSection title={"\u{1F680} How It Works"}>
        <ol className="list-decimal space-y-4 pl-5">
          <li>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {"1\uFE0F\u20E3"} Create Your Account
            </span>
            <p className="mt-1">
              Sign up on GoBenta.ph and start exploring the marketplace.
            </p>
          </li>
          <li>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {"2\uFE0F\u20E3"} Follow &amp; Share
            </span>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                {"\u{1F44D}"} Follow the GoBenta.ph Facebook page
              </li>
              <li>
                {"\u{1F504}"} Share the giveaway post (make sure it&apos;s public)
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {"3\uFE0F\u20E3"} Buy or Sell Products
            </span>
            <p className="mt-1">
              Browse items or post your own products for sale.
            </p>
          </li>
          <li>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {"4\uFE0F\u20E3"} Earn Raffle Entries
            </span>
            <p className="mt-2">For every successful transaction, you get:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                {"\u{1F39F}\uFE0F"} 1 Raffle Entry for every purchase
              </li>
              <li>
                {"\u{1F39F}\uFE0F"} 1 Raffle Entry for every sale
              </li>
            </ul>
          </li>
        </ol>
      </LegalSection>

      <LegalSection
        title={"\u{1F4C8} The More You Transact, The More Chances You Get!"}
      >
        <p>There&apos;s no limit to how many entries you can earn.</p>
        <ul className="mt-3 list-none space-y-2">
          <li>{"\u{1F449}"} More buys = More entries</li>
          <li>{"\u{1F449}"} More sales = More entries</li>
          <li>
            {"\u{1F449}"} More entries = Higher chance to win {P}500,000
          </li>
        </ul>
      </LegalSection>

      <LegalSection title={"\u2705 Requirements to Qualify"}>
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          To be eligible for the raffle:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>{"\u2714"} Must follow the official GoBenta.ph Facebook page</li>
          <li>{"\u2714"} Must share the giveaway post publicly</li>
          <li>
            {"\u2714"} Must have at least one successful transaction (buy or sell)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title={"\u274C Disqualification Rules"}>
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          To keep the giveaway fair:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>{"\u274C"} Fake transactions are not allowed</li>
          <li>{"\u274C"} Dummy accounts will be disqualified</li>
          <li>
            {"\u274C"} Duplicate or fraudulent listings will invalidate entries
          </li>
          <li>
            {"\u274C"} Not following or not sharing the page will void eligibility
          </li>
        </ul>
      </LegalSection>

      <LegalSection title={"\u{1F4C5} Draw Date"}>
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {"\u{1F5D3}\uFE0F"} November 15, 2026
        </p>
        <p className="mt-2">
          Make sure you&apos;re actively buying or selling before the draw!
        </p>
      </LegalSection>

      <LegalSection title={"\u{1F4E2} Winner Announcement"}>
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          The winner will be:
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Announced on the official GoBenta.ph Facebook page</li>
          <li>Contacted directly via registered account details</li>
        </ul>
      </LegalSection>

      <LegalSection title={"\u{1F525} Why Join?"}>
        <ul className="list-disc space-y-2 pl-5">
          <li>{"\u{1F4BC}"} Start your online selling journey</li>
          <li>{"\u{1F4B0}"} Earn income while getting chances to win</li>
          <li>{"\u{1F389}"} It&apos;s 100% FREE to join!</li>
        </ul>
      </LegalSection>

      <LegalSection title={"\u{1F680} Start Now!"}>
        <ul className="list-none space-y-2">
          <li>{"\u{1F449}"} Follow the page</li>
          <li>{"\u{1F449}"} Share the post</li>
          <li>{"\u{1F449}"} Buy or sell products</li>
          <li>{"\u{1F449}"} Earn raffle entries</li>
        </ul>
        <p className="mt-4 font-semibold text-zinc-800 dark:text-zinc-200">
          {"\u{1F4A5}"} Your next transaction could bring you closer to{" "}
          {`${P}500,000`}!
        </p>
        <p className="mt-4">
          <Link
            href="/listing/new"
            className="font-semibold text-brand hover:underline dark:text-emerald-400"
          >
            Post a listing →
          </Link>
          {" · "}
          <Link
            href="/"
            className="font-semibold text-brand hover:underline dark:text-emerald-400"
          >
            Browse marketplace →
          </Link>
        </p>
      </LegalSection>
    </article>
  );
}
