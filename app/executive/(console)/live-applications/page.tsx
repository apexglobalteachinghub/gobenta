import { ExecutiveLiveApplicationsClient } from "@/components/executive/executive-live-applications-client";

export default function ExecutiveLiveApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          Verification
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Live seller applications
        </h2>
      </div>
      <ExecutiveLiveApplicationsClient />
    </div>
  );
}
