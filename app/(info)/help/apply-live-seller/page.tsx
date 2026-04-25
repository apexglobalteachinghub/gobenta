import type { Metadata } from "next";
import Link from "next/link";
import { LiveSellerApplicationPanel } from "@/components/live/live-seller-application-panel";
import { getMainCategories } from "@/lib/queries/categories";
import { getActiveListingsForUser } from "@/lib/queries/listings";
import { createClient } from "@/lib/supabase/server";
import type { LiveSellerApplicationRow } from "@/types/live-selling";

export const metadata: Metadata = {
  title: "Apply as Live Seller",
  description:
    "Apply to host live selling streams on GoBenta.ph. Executive review required before you can go live.",
};

const nextPath = "/help/apply-live-seller";

export default async function ApplyLiveSellerHelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const categories = await getMainCategories();

  if (!user) {
    return (
      <article className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Apply as Live Seller
        </h1>
        <div className="space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>
            Live selling on GoBenta lets verified sellers stream and offer
            products using a <strong className="text-zinc-800 dark:text-zinc-200">claim</strong> flow (buyers arrange payment and delivery in chat — there is no in-app checkout).
          </p>
          <p>
            To protect buyers, <strong className="text-zinc-800 dark:text-zinc-200">every applicant is reviewed by our team</strong> before the{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">Verified Live Seller</strong> badge is granted and you can start a stream.
          </p>
          <p>
            Log in or create an account to submit your store details, contact
            information, valid ID, categories, and sample listings.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="inline-flex rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Log in to apply
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(nextPath)}`}
            className="inline-flex rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Register
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          Questions? See{" "}
          <Link href="/faq" className="font-medium text-brand hover:underline">
            FAQ
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-medium text-brand hover:underline">
            contact us
          </Link>
          .
        </p>
      </article>
    );
  }

  const [activeListings, profileRes, appRes] = await Promise.all([
    getActiveListingsForUser(user.id),
    supabase
      .from("users")
      .select("is_verified_live_seller")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("live_seller_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const initialApplication = appRes.error
    ? null
    : (appRes.data as LiveSellerApplicationRow | null);

  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Apply as Live Seller
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Help Center · verification required before going live
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
        <p>
          Submit the form below with the same details we use for verification:{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">store name</strong>,{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">contact details</strong>, a{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">valid ID</strong> upload,{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">product categories</strong>, and{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">sample listings</strong> from your shop. Optional: past live-selling experience.
        </p>
        <p>
          Our team reviews each application. You&apos;ll see status updates here
          and in your{" "}
          <Link
            href="/profile/selling"
            className="font-semibold text-brand hover:underline"
          >
            Selling
          </Link>{" "}
          dashboard. Only <strong className="text-zinc-800 dark:text-zinc-200">approved</strong> sellers receive the verified badge and can use{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">Go Live</strong>.
        </p>
      </div>

      <LiveSellerApplicationPanel
        userId={user.id}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        activeListings={activeListings.map((l) => ({
          id: l.id,
          title: l.title,
          price: Number(l.price),
        }))}
        initialApplication={initialApplication}
        isVerifiedLiveSeller={Boolean(profileRes.data?.is_verified_live_seller)}
        title="Your application"
      />

      <p className="text-xs text-zinc-500">
        <Link href="/faq" className="font-medium text-brand hover:underline">
          FAQ
        </Link>
        {" · "}
        <Link href="/contact" className="font-medium text-brand hover:underline">
          Contact us
        </Link>
      </p>
    </article>
  );
}
