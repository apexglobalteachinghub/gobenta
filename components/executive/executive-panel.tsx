import { cn } from "@/lib/cn";

export function ExecutivePanel({
  title,
  description,
  children,
  className,
  eyebrow,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-12px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50/90 to-white px-6 py-4 dark:border-zinc-800 dark:from-zinc-900/90 dark:to-zinc-900/40">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
