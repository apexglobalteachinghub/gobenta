import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Protect yourself against scams & phishing",
  description:
    "Safety tips for buyers and sellers on GoBenta.ph — verify, avoid red flags, and report.",
};

export default function ProtectYourselfPage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          🔒 Protect yourself against scams &amp; phishing
        </h1>
        <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Stay safe on GoBenta.ph
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Your safety is your responsibility. Here are key precautions:
        </p>
      </header>

      <LegalSection title="1. Verify before you pay">
        <ul className="list-disc space-y-2 pl-5">
          <li>Always check seller profiles and reviews</li>
          <li>Ask for proof (photos, videos, receipts)</li>
          <li>Avoid deals that seem &ldquo;too good to be true&rdquo;</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Avoid advance payments">
        <ul className="list-disc space-y-2 pl-5">
          <li>Do not send full payment upfront to unknown sellers</li>
          <li>Use meetups or trusted payment methods when possible</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Watch for red flags">
        <ul className="list-disc space-y-2 pl-5">
          <li>Rush transactions (&ldquo;buy now or lose it&rdquo;)</li>
          <li>Refusal to meet or verify identity</li>
          <li>
            Requests to move conversation outside the platform immediately
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Protect your information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Never share passwords, OTPs, or banking details</li>
          <li>Avoid clicking suspicious links</li>
          <li>Be cautious with file downloads</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Meet safely">
        <ul className="list-disc space-y-2 pl-5">
          <li>Choose public locations</li>
          <li>Bring a companion if possible</li>
          <li>Inspect items before payment</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Report suspicious activity">
        <p>If you encounter scams or suspicious users:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Report them immediately through GoBenta.ph</li>
          <li>Block the user</li>
          <li>Notify authorities if necessary</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Final reminder">
        <p>
          GoBenta.ph acts solely as a platform provider and shall not be held liable
          for any direct or indirect damages resulting from user interactions,
          transactions, or misuse of the platform.
        </p>
      </LegalSection>
    </article>
  );
}
