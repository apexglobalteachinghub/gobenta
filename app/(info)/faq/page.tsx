import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { faqItems } from "@/components/faq/faq-content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about GoBenta.ph.",
};

export default function FaqPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Frequently asked questions
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Quick answers about using GoBenta.ph. For legal wording, see{" "}
          <Link href="/terms" className="font-medium text-brand hover:underline">
            Terms &amp; conditions
          </Link>
          .
        </p>
      </header>
      <FaqAccordion items={faqItems} />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Still need help?{" "}
        <Link href="/contact" className="font-medium text-brand hover:underline">
          Contact us
        </Link>
        .
      </p>
    </article>
  );
}
