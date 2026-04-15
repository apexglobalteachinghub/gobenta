import { Suspense } from "react";
import { CategoryCarousel } from "@/components/layout/category-carousel";
import { Navbar } from "@/components/layout/navbar";
import { getMainCategories } from "@/lib/queries/categories";

export default async function ListingSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getMainCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense fallback={<div className="h-20 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950" />}>
        <CategoryCarousel categories={categories} />
      </Suspense>
      {children}
    </div>
  );
}
