import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with GoBenta.ph.",
};

export default function ContactPage() {
  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Contact us
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          We read every message. For account or safety issues, include your
          registered email and any listing or message IDs that help us investigate.
        </p>
      </header>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Email
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          <a
            href="mailto:support@gobenta.ph"
            className="font-medium text-brand hover:underline"
          >
            support@gobenta.ph
          </a>
        </p>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          We aim to reply within a few business days.
        </p>
      </section>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Before writing, you may find an answer in the{" "}
        <Link href="/faq" className="font-medium text-brand hover:underline">
          FAQ
        </Link>
        .
      </p>
    </article>
  );
}
