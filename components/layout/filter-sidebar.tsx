"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import type { CategoryRow } from "@/types/database";
import { cn } from "@/lib/cn";
import {
  PhLocationFilters,
  type PhGeoNames,
} from "@/components/layout/ph-location-filters";

type Props = {
  mainCategories: CategoryRow[];
  allCategories: CategoryRow[];
  embedded?: boolean;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

type AdvancedInitial = {
  min: string;
  max: string;
  province: string;
  city: string;
  brgy: string;
  tag: string;
};

function FilterSidebarAdvanced({
  initial,
  apply,
  pending,
  condition,
}: {
  initial: AdvancedInitial;
  apply: (updates: Record<string, string | undefined>) => void;
  pending: boolean;
  condition: string;
}) {
  const [minP, setMinP] = useState(initial.min);
  const [maxP, setMaxP] = useState(initial.max);
  const [tag, setTag] = useState(initial.tag);
  const [geo, setGeo] = useState<PhGeoNames>({
    province: initial.province,
    city: initial.city,
    brgy: initial.brgy,
  });

  const onGeo = useCallback((g: PhGeoNames) => {
    setGeo((prev) =>
      prev.province === g.province && prev.city === g.city && prev.brgy === g.brgy
        ? prev
        : g
    );
  }, []);

  const applyAdvancedFilters = useCallback(() => {
    apply({
      min: minP.trim() || undefined,
      max: maxP.trim() || undefined,
      province: geo.province.trim() || undefined,
      city: geo.city.trim() || undefined,
      brgy: geo.brgy.trim() || undefined,
      loc: undefined,
      tag: tag.trim() || undefined,
    });
  }, [apply, minP, maxP, geo, tag]);

  const geoInitial: PhGeoNames = {
    province: initial.province,
    city: initial.city,
    brgy: initial.brgy,
  };

  return (
    <>
      <section className="mb-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Price (PHP)
        </h3>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={minP}
            onChange={(e) => setMinP(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyAdvancedFilters();
              }
            }}
            className={cn(inputClass, "py-1.5")}
            aria-label="Minimum price in PHP"
          />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={maxP}
            onChange={(e) => setMaxP(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyAdvancedFilters();
              }
            }}
            className={cn(inputClass, "py-1.5")}
            aria-label="Maximum price in PHP"
          />
        </div>
      </section>

      <PhLocationFilters
        key={`${initial.province}|${initial.city}|${initial.brgy}`}
        initial={geoInitial}
        onNamesChange={onGeo}
        className="mb-4"
      />

      <section className="mb-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Condition
        </h3>
        <select
          value={condition}
          onChange={(e) => apply({ cond: e.target.value || undefined })}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Any</option>
          <option value="new">Brand new</option>
          <option value="like_new">Like new</option>
          <option value="used">Used</option>
          <option value="for_parts">For parts</option>
        </select>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Tag
        </h3>
        <input
          type="text"
          placeholder="One keyword, e.g. honda"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyAdvancedFilters();
            }
          }}
          className={inputClass}
          aria-label="Filter by tag"
        />
      </section>

      <button
        type="button"
        disabled={pending}
        className="mb-3 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-60"
        onClick={() => applyAdvancedFilters()}
      >
        {pending ? "Applying…" : "Apply filters"}
      </button>
    </>
  );
}

export function FilterSidebar({
  mainCategories,
  allCategories,
  embedded = false,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const catId = params.get("cat") ?? "";
  const subs = useMemo(
    () =>
      catId ? allCategories.filter((c) => c.parent_id === catId) : [],
    [allCategories, catId]
  );

  const apply = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      startTransition(() => router.push(`/?${next.toString()}`));
    },
    [params, router]
  );

  const advancedKey = [
    params.get("min") ?? "",
    params.get("max") ?? "",
    params.get("province") ?? "",
    params.get("city") ?? "",
    params.get("brgy") ?? "",
    params.get("tag") ?? "",
  ].join("|");

  const advancedInitial: AdvancedInitial = {
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    province: params.get("province") ?? "",
    city: params.get("city") ?? "",
    brgy: params.get("brgy") ?? "",
    tag: params.get("tag") ?? "",
  };

  const condValue = params.get("cond") ?? "";

  const Tag = embedded ? "div" : "aside";

  return (
    <Tag
      className={cn(
        embedded
          ? "w-full"
          : "sticky top-[7.25rem] hidden h-[calc(100vh-8rem)] w-64 shrink-0 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:block dark:border-zinc-800 dark:bg-zinc-900",
        !embedded && pending && "opacity-70",
        embedded && pending && "opacity-70"
      )}
    >
      <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Filters
      </h2>

      <section className="mb-4">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Category
        </h3>
        <select
          value={catId}
          onChange={(e) => {
            const v = e.target.value;
            apply({ cat: v || undefined, sub: undefined });
          }}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">All categories</option>
          {mainCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </section>

      {subs.length > 0 && (
        <section className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Subcategory
          </h3>
          <select
            value={params.get("sub") ?? ""}
            onChange={(e) => apply({ sub: e.target.value || undefined })}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">Any</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </section>
      )}

      <FilterSidebarAdvanced
        key={advancedKey}
        initial={advancedInitial}
        apply={apply}
        pending={pending}
        condition={condValue}
      />

      <button
        type="button"
        className="w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        onClick={() => startTransition(() => router.push("/"))}
      >
        Clear all
      </button>
    </Tag>
  );
}
