import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Marketplace rules",
  description:
    "Rules for listings, conduct, and enforcement on GoBenta.ph.",
};

export default function MarketplaceRulesPage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          📋 Marketplace rules
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Updated</p>
      </header>

      <LegalSection title="1. General conduct">
        <p>Users must:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Be honest and transparent in listings</li>
          <li>Use respectful and professional communication</li>
          <li>Follow all applicable Philippine laws</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Prohibited activities">
        <p>The following are strictly prohibited:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Posting fake or misleading listings</li>
          <li>Selling illegal, counterfeit, or prohibited items</li>
          <li>Scamming, phishing, or fraudulent behavior</li>
          <li>Using the platform to harass or abuse others</li>
          <li>Sharing false contact or payment information</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Listings guidelines">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate product descriptions</li>
          <li>Use real images (no misleading photos)</li>
          <li>Clearly state price, condition, and terms</li>
          <li>Do not duplicate spam listings</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Transactions">
        <ul className="list-disc space-y-2 pl-5">
          <li>Buyers and sellers must agree on terms independently</li>
          <li>GoBenta.ph does not mediate payments unless stated otherwise</li>
          <li>Meetups and deliveries should be arranged safely</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Enforcement">
        <p>GoBenta.ph reserves the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Remove listings</li>
          <li>Suspend or terminate accounts</li>
          <li>Report illegal activities to authorities</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Legal notice">
        <p>
          GoBenta.ph acts solely as a platform provider and shall not be held liable
          for any direct or indirect damages resulting from user interactions,
          transactions, or misuse of the platform.
        </p>
      </LegalSection>
    </article>
  );
}
