import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";

const CategoryCarousel = dynamic(() =>
  import("@/components/layout/category-carousel").then((m) => m.CategoryCarousel)
);
const FilterSidebar = dynamic(() =>
  import("@/components/layout/filter-sidebar").then((m) => m.FilterSidebar)
);
const MobileFilterPanel = dynamic(() =>
  import("@/components/layout/mobile-filter-panel").then(
    (m) => m.MobileFilterPanel
  )
);
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
