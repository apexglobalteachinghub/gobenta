import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How GoBenta.ph collects, uses, and protects your personal information in line with Philippine data privacy expectations.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Privacy policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: April 15, 2026. This policy describes how GoBenta.ph
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) handles personal information when you use
          our website and related services.
        </p>
      </header>

      <LegalSection title="1. Who this applies to">
        <p>
          This policy applies to visitors, registered users, buyers, and sellers who
          access or use GoBenta.ph. If you do not agree with this policy, please do
          not use the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>Depending on how you use GoBenta.ph, we may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Account and profile data:
            </span>{" "}
            such as name, email address, and other details you choose to add to your
            profile.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Listing and transaction-related data:
            </span>{" "}
            descriptions, photos, prices, categories, and messages you send in
            connection with listings or deals.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Communications:
            </span>{" "}
            messages you send to us (for example through{" "}
            <Link href="/contact" className="font-medium text-brand hover:underline dark:text-emerald-400">
              Contact us
            </Link>
            ) and in-app chat content between users.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Technical and usage data:
            </span>{" "}
            such as device type, browser, approximate location derived from IP
            address, log data, and how you interact with pages and features.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and maintain your account and profile</li>
          <li>Display listings, enable search, and facilitate buyer–seller messaging</li>
          <li>Operate, secure, and improve the platform (including fraud prevention)</li>
          <li>Respond to support requests and enforce our policies</li>
          <li>Comply with applicable law and respond to lawful requests</li>
          <li>
            Where allowed, measure interest in our services and deliver relevant
            communications or advertising.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies and similar technologies">
        <p>
          We use cookies and similar technologies to keep you signed in, remember
          preferences, understand traffic and usage, and—where you have not opted out
          of such tools—support analytics or advertising partners. You can control
          cookies through your browser settings; blocking some cookies may limit
          certain features.
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>We may share information as follows:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              With other users:
            </span>{" "}
            information you choose to publish (for example public profile or listing
            details) or that is reasonably needed to complete a conversation or sale.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              With service providers:
            </span>{" "}
            vendors that host our infrastructure, provide authentication, messaging,
            email delivery, analytics, or security—under terms that require them to
            protect your data and use it only for the services they provide to us.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              For legal reasons:
            </span>{" "}
            if we believe disclosure is required by law, regulation, legal process, or
            to protect the rights, safety, or property of users, GoBenta.ph, or the
            public.
          </li>
          <li>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Business transfers:
            </span>{" "}
            in connection with a merger, acquisition, or sale of assets, your
            information may transfer as part of that transaction.
          </li>
        </ul>
        <p>
          We do not sell your personal information in the conventional sense of
          selling lists of individuals to third parties for their own marketing.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          We keep information only as long as needed for the purposes above, including
          legal, accounting, or reporting requirements. When data is no longer
          needed, we delete or anonymize it where practicable.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use reasonable technical and organizational measures to protect personal
          information. No method of transmission over the internet is completely
          secure; we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices and rights">
        <p>
          Subject to applicable law—including the Philippine Data Privacy Act of 2012
          and related regulations—you may have rights to access, update, or correct
          your personal information, object to certain processing, or withdraw consent
          where processing is based on consent. You may also have the right to
          lodge a concern with the National Privacy Commission (NPC).
        </p>
        <p>
          To exercise rights or ask questions, contact us through{" "}
          <Link href="/contact" className="font-medium text-brand hover:underline dark:text-emerald-400">
            Contact us
          </Link>
          . We may need to verify your identity before fulfilling a request.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          GoBenta.ph is not directed at children under the age of majority. We do not
          knowingly collect personal information from children. If you believe we
          have collected such information, please contact us so we can delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. International transfers">
        <p>
          Our service providers may process data in the Philippines or other
          countries. Where data is transferred across borders, we take steps
          consistent with applicable law to protect your information.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this privacy policy from time to time. We will post the
          revised version on this page and adjust the &quot;Last updated&quot; date. For
          material changes, we may provide additional notice as appropriate.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          For privacy-related requests or questions, reach us via{" "}
          <Link href="/contact" className="font-medium text-brand hover:underline dark:text-emerald-400">
            Contact us
          </Link>
          . For general rules of use, see also our{" "}
          <Link href="/terms" className="font-medium text-brand hover:underline dark:text-emerald-400">
            Terms &amp; conditions
          </Link>
          .
        </p>
      </LegalSection>
    </article>
  );
}
