"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ExecutiveCategoryCount,
  ExecutiveDailyRow,
  ExecutivePaymentCount,
} from "@/types/executive-dashboard";
import { formatPaymentOption } from "@/lib/executive/payment-label";

const BRAND_GREEN = "#2e7d32";
const BRAND_ORANGE = "#f57c00";
const ACCENT_VIOLET = "#6366f1";

function useDarkCharts() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setDark(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return dark;
}

function chartTheme(dark: boolean) {
  return {
    grid: dark ? "#27272a" : "#e4e4e7",
    axis: dark ? "#a1a1aa" : "#71717a",
    tooltipBg: dark ? "#18181b" : "#ffffff",
    tooltipBorder: dark ? "#3f3f46" : "#e4e4e7",
    label: dark ? "#fafafa" : "#18181b",
  };
}

type TrendDatum = {
  label: string;
  fullDate: string;
  new_users: number;
  new_listings: number;
  visits: number;
};

export function ExecutiveTrendChart({ daily }: { daily: ExecutiveDailyRow[] }) {
  const dark = useDarkCharts();
  const t = chartTheme(dark);

  const data = useMemo<TrendDatum[]>(() => {
    const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((d) => {
      const [, m, day] = d.date.split("-");
      return {
        fullDate: d.date,
        label: m && day ? `${m}/${day}` : d.date,
        new_users: d.new_users,
        new_listings: d.new_listings,
        visits: d.visits,
      };
    });
  }, [daily]);

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
        No trend data in this range.
      </div>
    );
  }

  return (
    <div className="h-[340px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={t.grid}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.grid }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: "12px",
              fontSize: "13px",
              boxShadow:
                "0 10px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.04)",
            }}
            labelStyle={{ color: t.label, fontWeight: 600, marginBottom: 4 }}
            formatter={(value, name) => {
              const n = Number(value ?? 0);
              return [
                Number.isFinite(n) ? n.toLocaleString("en-PH") : String(value ?? ""),
                name,
              ];
            }}
            labelFormatter={(_, payload) => {
              const row = payload?.[0]?.payload as TrendDatum | undefined;
              return row?.fullDate ?? "";
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: 16 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="new_users"
            name="New accounts"
            stroke={BRAND_GREEN}
            strokeWidth={2}
            fill={BRAND_GREEN}
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="new_listings"
            name="New listings"
            stroke={BRAND_ORANGE}
            strokeWidth={2}
            fill={BRAND_ORANGE}
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="visits"
            name="Page beacons"
            stroke={ACCENT_VIOLET}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExecutiveCategoryChart({
  categories,
}: {
  categories: ExecutiveCategoryCount[];
}) {
  const dark = useDarkCharts();
  const t = chartTheme(dark);

  const data = useMemo(
    () =>
      [...categories]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => ({
          name:
            c.name.length > 28 ? `${c.name.slice(0, 26)}…` : c.name,
          fullName: c.name,
          count: c.count,
        })),
    [categories]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-600">
        No categories yet.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={t.grid}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.grid }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={112}
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: "12px",
              fontSize: "13px",
            }}
            formatter={(v) => [
              Number(v ?? 0).toLocaleString("en-PH"),
              "Listings",
            ]}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""
            }
          />
          <Bar
            dataKey="count"
            name="Listings"
            radius={[0, 6, 6, 0]}
            fill={BRAND_GREEN}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExecutivePaymentChart({
  payments,
}: {
  payments: ExecutivePaymentCount[];
}) {
  const dark = useDarkCharts();
  const t = chartTheme(dark);

  const data = useMemo(
    () =>
      [...payments]
        .sort((a, b) => b.count - a.count)
        .map((p) => ({
          name: formatPaymentOption(p.option),
          count: p.count,
        })),
    [payments]
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-600">
        No payment mix data.
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={t.grid}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: t.grid }}
          />
          <YAxis
            tick={{ fill: t.axis, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: "12px",
              fontSize: "13px",
            }}
            formatter={(v) => [
              Number(v ?? 0).toLocaleString("en-PH"),
              "Uses",
            ]}
          />
          <Bar
            dataKey="count"
            name="Uses"
            radius={[6, 6, 0, 0]}
            fill={BRAND_ORANGE}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
