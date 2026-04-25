"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function AccountSuspendedSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createClient();
    const { error: globalErr } = await supabase.auth.signOut({
      scope: "global",
    });
    if (globalErr) {
      await supabase.auth.signOut({ scope: "local" });
    }
    setPending(false);
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void signOut()}
      className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
