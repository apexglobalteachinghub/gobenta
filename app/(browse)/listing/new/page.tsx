import type { Metadata } from "next";
import { CreateListingForm } from "@/components/listing/create-listing-form";
import {
  getAllCategoriesFlat,
  getMainCategories,
} from "@/lib/queries/categories";

export const metadata: Metadata = {
  title: "Create listing",
  description: "Post a new item on the marketplace.",
};

export default async function NewListingPage() {
  const [mainCategories, allCategories] = await Promise.all([
    getMainCategories(),
    getAllCategoriesFlat(),
  ]);

  if (!mainCategories.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Categories not loaded</p>
        <p className="mt-2 text-sm">
          Run <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">supabase/seed.sql</code>{" "}
          in your Supabase project, then refresh.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Create a listing
      </h1>
      <CreateListingForm
        mainCategories={mainCategories}
        allCategories={allCategories}
      />
    </div>
  );
}
