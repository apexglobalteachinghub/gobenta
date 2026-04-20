"use client";

import { useMemo, useState } from "react";
import type { ExecutiveDailyRow } from "@/types/executive-dashboard";
import { ExecutivePanel } from "@/components/executive/executive-panel";
import { cn } from "@/lib/cn";

type Props = {
  daily: ExecutiveDailyRow[];
  timezone: string;
};

function pctClass(v: number): string {
  if (v > 0) return "text-emerald-600 dark:text-emerald-400";
  if (v < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500 dark:text-zinc-400";
}

export function ExecutiveDashboardClient({ daily, timezone }: Props) {
  const sorted = useMemo(
    () => [...daily].sort((a, b) => a.date.localeCompare(b.date)),
    [daily]
  );
  const last = sorted[sorted.length - 1];
  const [selected, setSelected] = useState(last?.date ?? "");

  const minD = sorted[0]?.date ?? "";
  const maxD = last?.date ?? "";
  const row = sorted.find((d) => d.date === selected);

  const recent = useMemo(() => [...sorted].reverse().slice(0, 14), [sorted]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ExecutivePanel
        eyebrow="Drill-down"
        title="Day detail"
        description={`Pick any day (${timezone}) to see volume and day-over-day % change vs the prior day.`}
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Date
            </label>
            <input
              type="date"
              className="w-full max-w-[260px] rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm outline-none ring-brand/20 transition focus:border-brand focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
              min={minD || undefined}
              max={maxD || undefined}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            />
          </div>
        </div>
        {row ? (
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                New accounts
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {row.new_users}
              </dd>
              <dd
                className={cn(
                  "mt-1 text-sm font-semibold tabular-nums",
                  pctClass(row.pct_user_growth)
                )}
              >
                {row.pct_user_growth > 0 ? "+" : ""}
                {row.pct_user_growth}% vs prior day
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                New listings
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {row.new_listings}
              </dd>
              <dd
                className={cn(
                  "mt-1 text-sm font-semibold tabular-nums",
                  pctClass(row.pct_listing_growth)
                )}
              >
                {row.pct_listing_growth > 0 ? "+" : ""}
                {row.pct_listing_growth}% vs prior day
              </dd>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 sm:col-span-1">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Page beacons
              </dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {row.visits}
              </dd>
              <dd
                className={cn(
                  "mt-1 text-sm font-semibold tabular-nums",
                  pctClass(row.pct_visit_growth)
                )}
              >
                {row.pct_visit_growth > 0 ? "+" : ""}
                {row.pct_visit_growth}% vs prior day
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
            No data for that date.
          </p>
        )}
      </ExecutivePanel>

      <ExecutivePanel
        eyebrow="Recent"
        title="Last 14 days"
        description="Newest first. Δ columns are percent change vs the previous calendar day."
      >
        <div className="-mx-2 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                <th className="border-b border-zinc-200 py-3 pl-2 pr-3 dark:border-zinc-700">
                  Date
                </th>
                <th className="border-b border-zinc-200 py-3 pr-3 dark:border-zinc-700">
                  Accts
                </th>
                <th className="border-b border-zinc-200 py-3 pr-3 dark:border-zinc-700">
                  Δ
                </th>
                <th className="border-b border-zinc-200 py-3 pr-3 dark:border-zinc-700">
                  List
                </th>
                <th className="border-b border-zinc-200 py-3 pr-3 dark:border-zinc-700">
                  Δ
                </th>
                <th className="border-b border-zinc-200 py-3 pr-3 dark:border-zinc-700">
                  Beacon
                </th>
                <th className="border-b border-zinc-200 py-3 pr-2 dark:border-zinc-700">
                  Δ
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => (
                <tr
                  key={d.date}
                  className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30"
                >
                  <td className="border-b border-zinc-100 py-2.5 pl-2 pr-3 font-medium text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
                    {d.date}
                  </td>
                  <td className="border-b border-zinc-100 py-2.5 pr-3 tabular-nums dark:border-zinc-800">
                    {d.new_users}
                  </td>
                  <td
                    className={cn(
                      "border-b border-zinc-100 py-2.5 pr-3 tabular-nums font-semibold dark:border-zinc-800",
                      pctClass(d.pct_user_growth)
                    )}
                  >
                    {d.pct_user_growth > 0 ? "+" : ""}
                    {d.pct_user_growth}%
                  </td>
                  <td className="border-b border-zinc-100 py-2.5 pr-3 tabular-nums dark:border-zinc-800">
                    {d.new_listings}
                  </td>
                  <td
                    className={cn(
                      "border-b border-zinc-100 py-2.5 pr-3 tabular-nums font-semibold dark:border-zinc-800",
                      pctClass(d.pct_listing_growth)
                    )}
                  >
                    {d.pct_listing_growth > 0 ? "+" : ""}
                    {d.pct_listing_growth}%
                  </td>
                  <td className="border-b border-zinc-100 py-2.5 pr-3 tabular-nums dark:border-zinc-800">
                    {d.visits}
                  </td>
                  <td
                    className={cn(
                      "border-b border-zinc-100 py-2.5 pr-2 tabular-nums font-semibold dark:border-zinc-800",
                      pctClass(d.pct_visit_growth)
                    )}
                  >
                    {d.pct_visit_growth > 0 ? "+" : ""}
                    {d.pct_visit_growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ExecutivePanel>
    </div>
  );
}
