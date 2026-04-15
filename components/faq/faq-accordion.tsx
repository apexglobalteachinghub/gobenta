"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

export function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      {items.map((item, index) => {
        const open = openId === item.id;
        const panelId = `faq-panel-${item.id}`;
        const buttonId = `faq-trigger-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              "border-zinc-200 dark:border-zinc-800",
              index !== 0 && "border-t"
            )}
          >
            <h2 className="text-base font-semibold">
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-zinc-900 transition hover:bg-zinc-50 dark:text-zinc-50 dark:hover:bg-zinc-800/80 sm:px-5 sm:py-4"
              >
                <span className="pr-2">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-zinc-500 transition-transform dark:text-zinc-400",
                    open && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
            </h2>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
            >
              <div className="border-t border-zinc-100 px-4 pb-4 pt-0 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 sm:px-5">
                <div className="pt-3">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
