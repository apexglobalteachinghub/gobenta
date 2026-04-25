import Link from "next/link";
import { Radio } from "lucide-react";

export function AuthLinks() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/live"
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <Radio className="h-4 w-4" aria-hidden />
        Live
      </Link>
      <Link
        href="/login"
        className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="rounded-full bg-brand-accent px-3 py-2 text-sm font-medium text-white hover:bg-brand-accent-hover"
      >
        Register
      </Link>
    </div>
  );
}
