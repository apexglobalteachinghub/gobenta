"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryIcon } from "@/lib/category-icon";
import type { CategoryRow } from "@/types/database";
import { cn } from "@/lib/cn";

export function CategoryCarousel({ categories }: { categories: CategoryRow[] }) {
  const params = useSearchParams();
  const active = params.get("cat");

  return (
    <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4">
        <div
          className="flex gap-3 overflow-x-auto py-2 scrollbar-thin"
          style={{ scrollbarWidth: "thin" }}
        >
          <CarouselItem
            href="/"
            label="All"
            icon={<CategoryIcon name="cart" className="h-7 w-7" />}
            active={!active}
          />
          {categories.map((c) => {
            const next = new URLSearchParams(params.toString());
            next.set("cat", c.id);
            next.delete("sub");
            return (
              <CarouselItem
                key={c.id}
                href={`/?${next.toString()}`}
                label={c.name}
                icon={<CategoryIcon name={c.icon} className="h-7 w-7" />}
                active={active === c.id}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CarouselItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-medium transition",
        active
          ? "bg-brand-surface text-brand dark:bg-brand-surface-dark dark:text-emerald-300"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </span>
      <span className="line-clamp-2 w-[76px]">{label}</span>
    </Link>
  );
}
