"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { cn } from "@/lib/cn";

type Suggestion = { id: string; title: string };

function SearchBarFields({
  className,
  initialQ,
}: {
  className?: string;
  initialQ: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSg, setLoadingSg] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const submit = useCallback(() => {
    setOpen(false);
    const next = new URLSearchParams(params.toString());
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    startTransition(() => {
      router.push(`/?${next.toString()}`);
    });
  }, [q, params, router]);

  const clear = useCallback(() => {
    setQ("");
    setSuggestions([]);
    setOpen(false);
    const next = new URLSearchParams(params.toString());
    next.delete("q");
    startTransition(() => router.push(`/?${next.toString()}`));
  }, [params, router]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const term = q.trim();
      if (term.length < 1) {
        setSuggestions([]);
        setLoadingSg(false);
        return;
      }
      setLoadingSg(true);
      fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`)
        .then((r) => r.json() as Promise<Suggestion[]>)
        .then((data) => {
          setSuggestions(Array.isArray(data) ? data : []);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSg(false));
    }, 220);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pickSuggestion = useCallback(
    (title: string) => {
      setQ(title);
      setOpen(false);
      const next = new URLSearchParams(params.toString());
      next.set("q", title.trim());
      startTransition(() => router.push(`/?${next.toString()}`));
    },
    [params, router]
  );

  const showDropdown =
    open && q.trim().length >= 1 && (loadingSg || suggestions.length > 0);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      role="search"
      aria-label="Search GoBenta listings"
    >
      <div
        className={cn(
          "flex min-h-[2.85rem] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm",
          "focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15",
          "dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:ring-brand/25",
          "sm:flex-row sm:items-center sm:rounded-full sm:pr-1"
        )}
      >
        <div
          ref={wrapRef}
          className={cn(
            "relative flex min-h-[2.35rem] min-w-0 flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800/70",
            "sm:rounded-full sm:px-4"
          )}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listId}
        >
          <Search
            className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search listings, brands, keywords…"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Search listings"
            aria-autocomplete="list"
          />
          {q ? (
            <button
              type="button"
              onClick={() => clear()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {showDropdown ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute left-2 right-2 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:left-3 sm:right-3"
            >
              {loadingSg && suggestions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-500">Searching…</li>
              ) : null}
              {suggestions.map((s) => (
                <li key={s.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(s.title)}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className={cn(
            "mt-1 min-h-[2.5rem] w-full shrink-0 rounded-xl px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60",
            "bg-brand sm:mt-0 sm:w-auto sm:rounded-full sm:px-6"
          )}
        >
          {pending ? "…" : "Search"}
        </button>
      </div>
    </form>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const params = useSearchParams();
  const qFromUrl = params.get("q") ?? "";
  return (
    <SearchBarFields key={qFromUrl} className={className} initialQ={qFromUrl} />
  );
}
