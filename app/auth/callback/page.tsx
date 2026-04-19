import { Suspense } from "react";
import { AuthCallbackClient } from "@/components/auth/auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
          Loading…
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
