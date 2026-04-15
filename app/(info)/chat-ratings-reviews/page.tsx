import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Chat, ratings & reviews policy",
  description:
    "How ratings, reviews, and chat work on GoBenta.ph — fair use and moderation.",
};

export default function ChatRatingsReviewsPage() {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ⭐ Chat, ratings &amp; reviews policy
        </h1>
      </header>

      <LegalSection title="1. Purpose">
        <p>
          Ratings and reviews help build trust in the GoBenta.ph community.
        </p>
      </LegalSection>

      <LegalSection title="2. Fair use">
        <p>Users may:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Leave honest feedback based on actual transactions</li>
          <li>Rate communication, product quality, and reliability</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Prohibited reviews">
        <p>You may NOT:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Post fake or misleading reviews</li>
          <li>Use offensive, abusive, or defamatory language</li>
          <li>Manipulate ratings (self-reviews, fake accounts)</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Chat guidelines">
        <ul className="list-disc space-y-2 pl-5">
          <li>Keep conversations respectful and relevant</li>
          <li>Do not send spam, phishing links, or malicious content</li>
          <li>Avoid sharing sensitive personal or financial information</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Moderation">
        <p>GoBenta.ph may:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Remove inappropriate reviews</li>
          <li>Restrict chat access for violations</li>
          <li>Suspend accounts abusing the system</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Disclaimer">
        <p>
          GoBenta.ph acts solely as a platform provider and shall not be held liable
          for any direct or indirect damages resulting from user interactions,
          transactions, or misuse of the platform.
        </p>
      </LegalSection>
    </article>
  );
}
