import type { Metadata } from "next";
import type { ComponentType } from "react";
import {
  Activity,
  Banknote,
  ShoppingBag,
  Users,
} from "lucide-react";
import {
  ExecutiveCategoryChart,
  ExecutivePaymentChart,
  ExecutiveTrendChart,
} from "@/components/executive/executive-charts";
import { ExecutiveDashboardClient } from "@/components/executive/executive-dashboard-client";
import { ExecutivePanel } from "@/components/executive/executive-panel";
import { fetchExecutiveDashboard } from "@/lib/executive/dashboard";
import { getExecutiveDashboardGreeting } from "@/lib/executive/dashboard-greeting";
import { formatPaymentOption } from "@/lib/executive/payment-label";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Dashboard",
};

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function RankedList({
  rows,
  empty,
}: {
  rows: { label: string; count: number }[];
  empty: string;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {empty}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const label = r.label;
        const count = r.count;
        const pct = Math.round((count / max) * 100);
        return (
          <li key={`${label}-${i}`} className="group">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                {label}
              </span>
              <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                {count.toLocaleString("en-PH")}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-600 transition-[width] duration-500 ease-out dark:from-brand dark:to-emerald-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function ExecutiveDashboardPage() {
  const [data, greeting] = await Promise.all([
    fetchExecutiveDashboard(),
    getExecutiveDashboardGreeting(),
  ]);

  if (!data) {
    return (
      <div className="space-y-6">
        {greeting ? (
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {greeting.phrase},{" "}
            <span className="text-zinc-900 dark:text-zinc-100">
              {greeting.displayName}
            </span>
          </p>
        ) : null}
        <div className="rounded-2xl border border-red-200/90 bg-red-50/90 p-8 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-100">
        <h2 className="text-lg font-semibold">Dashboard unavailable</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed">
          The executive RPC returned no data. Run{" "}
          <code className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/60">
            supabase/executive.sql
          </code>{" "}
          in the Supabase SQL editor and confirm your account has{" "}
          <code className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/60">
            is_executive = true
          </code>
          .
        </p>
        </div>
      </div>
    );
  }

  const avg = Number(data.avg_listing_price);
  const generated = new Date(data.generated_at).toLocaleString("en-PH", {
    timeZone: data.timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  const userLocRows = data.user_locations.map((u) => ({
    label: u.label,
    count: u.count,
  }));
  const provRows = data.listings_by_province.map((r) => ({
    label: r.province,
    count: r.count,
  }));

  return (
    <>
      {greeting ? (
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {greeting.phrase},{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {greeting.displayName}
          </span>
        </p>
      ) : null}
      <div className="mt-2 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Overview
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Marketplace intelligence
          </h2>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:text-right">
          Refreshes on load · {generated} · {data.timezone}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Total listings"
          value={data.total_listings.toLocaleString("en-PH")}
          accent="from-emerald-600/90 to-brand"
        />
        <StatCard
          icon={Users}
          label="Registered accounts"
          value={data.total_users.toLocaleString("en-PH")}
          accent="from-sky-600 to-blue-700"
        />
        <StatCard
          icon={Banknote}
          label="Average listing price"
          value={money.format(Number.isFinite(avg) ? avg : 0)}
          accent="from-amber-600 to-brand-accent"
        />
        <StatCard
          icon={Activity}
          label="Recorded visits"
          value={(data.total_site_visits ?? 0).toLocaleString("en-PH")}
          hint="First-party beacon rows (not GA-equivalent)."
          accent="from-violet-600 to-indigo-700"
        />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
          Traffic note:
        </strong>{" "}
        Visit counts come from your app&apos;s lightweight beacon. Use GA4 or
        similar for campaign-grade analytics; use this chart for directional
        trends alongside supply and signups.
      </div>

      <div className="mt-10 space-y-10">
        <ExecutivePanel
          eyebrow="Trends"
          title="Activity over time"
          description="Daily new accounts and listings (left scale) vs. page beacons (right scale). Hover points for exact numbers."
        >
          <ExecutiveTrendChart daily={data.daily} />
        </ExecutivePanel>

        <div className="grid gap-8 lg:grid-cols-2">
          <ExecutivePanel
            eyebrow="Supply"
            title="Listings by category"
            description="Top categories by live listing count."
          >
            <ExecutiveCategoryChart categories={data.listings_by_category} />
          </ExecutivePanel>

          <ExecutivePanel
            eyebrow="Payments"
            title="Payment methods in listings"
            description="How often each option appears on listings (multi-select allowed)."
          >
            <ExecutivePaymentChart payments={data.payment_mix} />
            {data.payment_mix.length > 0 ? (
              <ul className="mt-6 grid gap-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-2">
                {data.payment_mix.map((p) => (
                  <li
                    key={p.option}
                    className="flex justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {formatPaymentOption(p.option)}
                    </span>
                    <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                      {p.count.toLocaleString("en-PH")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </ExecutivePanel>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <ExecutivePanel
            eyebrow="People"
            title="Member locations"
            description="Grouped from public profile address hints. Richer data if users add city or area."
          >
            <RankedList rows={userLocRows} empty="No addresses on file." />
          </ExecutivePanel>

          <ExecutivePanel
            eyebrow="Geography"
            title="Listing provinces"
            description="Where inventory is listed, based on listing fields."
          >
            <RankedList
              rows={provRows}
              empty="No provinces set on listings."
            />
          </ExecutivePanel>
        </div>

        <ExecutiveDashboardClient daily={data.daily} timezone={data.timezone} />
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm",
        "dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.12] blur-2xl transition group-hover:opacity-[0.18]",
          `bg-gradient-to-br ${accent}`
        )}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
            `bg-gradient-to-br ${accent}`
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
