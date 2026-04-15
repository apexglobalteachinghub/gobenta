"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { CategoryRow } from "@/types/database";
import { FilterSidebar } from "@/components/layout/filter-sidebar";

/** Collapsible filters for small screens (sidebar is desktop-only). */
export function MobileFilterPanel({
  mainCategories,
  allCategories,
}: {
  mainCategories: CategoryRow[];
  allCategories: CategoryRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {open ? "Hide filters" : "Show filters"}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="max-h-[70vh] overflow-y-auto">
            <FilterSidebar
              embedded
              mainCategories={mainCategories}
              allCategories={allCategories}
            />
          </div>
        </div>
      )}
    </div>
  );
}
