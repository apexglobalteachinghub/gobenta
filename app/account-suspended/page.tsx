import type { Metadata } from "next";
import Link from "next/link";
import { AccountSuspendedSignOut } from "@/components/account/account-suspended-sign-out";

export const metadata: Metadata = {
  title: "Account suspended",
  robots: { index: false, follow: false },
};

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-center">
      <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <h1 className="text-xl font-bold text-white">Account suspended</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          This account can no longer use GoBenta.ph. If you think this is a
          mistake, contact support.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <AccountSuspendedSignOut />
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
