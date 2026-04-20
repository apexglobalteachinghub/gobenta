"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function ExecutiveDeniedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (params.get("executive") !== "denied") return;
    done.current = true;
    toast.error("That account is not authorized for the executive console.");
    const next = new URL(window.location.href);
    next.searchParams.delete("executive");
    router.replace(next.pathname + next.search, { scroll: false });
  }, [params, router]);

  return null;
}
