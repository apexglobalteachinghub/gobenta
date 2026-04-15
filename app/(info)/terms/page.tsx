import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "GoBenta.ph terms and conditions — platform role, user responsibility, and liability.",
};

export default function TermsPage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          📜 Terms &amp; conditions
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated for general informational use. By using GoBenta.ph you agree to
          these terms.
        </p>
      </header>

      <LegalSection title="1. Platform role">
        <p>
          GoBenta.ph is an online marketplace that connects buyers and sellers across
          the Philippines. We do not own, sell, or control the products and services
          listed on the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. User responsibility">
        <p>By using GoBenta.ph, you acknowledge that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>All transactions are solely between buyer and seller.</li>
          <li>
            You are responsible for verifying the identity and legitimacy of any user
            you interact with.
          </li>
          <li>
            You agree to practice due diligence before making any payments or
            agreements.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. No liability for transactions">
        <p>GoBenta.ph shall not be held liable for:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Fraud, scams, or phishing incidents</li>
          <li>Misrepresentation of products or services</li>
          <li>Failed deliveries or defective items</li>
          <li>Any loss of money, data, or personal information</li>
          <li>Disputes arising from negotiations or transactions</li>
        </ul>
        <p className="font-medium text-zinc-800 dark:text-zinc-200">
          All transactions are conducted at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="4. No guarantees">
        <p>We do not guarantee:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The accuracy of listings</li>
          <li>The legitimacy of sellers or buyers</li>
          <li>The success or safety of any transaction</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Legal disclaimer">
        <p>
          GoBenta.ph acts solely as a platform provider and shall not be held liable
          for any direct or indirect damages resulting from user interactions,
          transactions, or misuse of the platform.
        </p>
      </LegalSection>

      <LegalSection title="6. User agreement">
        <p>By continuing to use GoBenta.ph, you agree that:</p>
        <p>
          You assume full responsibility for your interactions, communications, and
          transactions on the platform.
        </p>
      </LegalSection>
    </article>
  );
}
