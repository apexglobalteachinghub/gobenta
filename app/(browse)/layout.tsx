import { Suspense } from "react";
import { CategoryCarousel } from "@/components/layout/category-carousel";
import { FilterSidebar } from "@/components/layout/filter-sidebar";
import { MobileFilterPanel } from "@/components/layout/mobile-filter-panel";
import { Navbar } from "@/components/layout/navbar";
import {
  getAllCategoriesFlat,
  getMainCategories,
} from "@/lib/queries/categories";

export default async function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mainCategories, allCategories] = await Promise.all([
    getMainCategories(),
    getAllCategoriesFlat(),
  ]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="h-20 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />}>
        <CategoryCarousel categories={mainCategories} />
      </Suspense>
      <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 gap-6 px-3 sm:px-4">
        <Suspense fallback={null}>
          <FilterSidebar
            mainCategories={mainCategories}
            allCategories={allCategories}
          />
        </Suspense>
        <main className="min-w-0 flex-1 pb-16 pt-2 lg:pt-4">
          <Suspense fallback={null}>
            <MobileFilterPanel
              mainCategories={mainCategories}
              allCategories={allCategories}
            />
          </Suspense>
          {children}
        </main>
      </div>
    </>
  );
}
