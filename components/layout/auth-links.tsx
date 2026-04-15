import Link from "next/link";

export function AuthLinks() {
  return (
    <div className="flex items-center gap-2">
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
