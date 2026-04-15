"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

export function FavoriteButton({
  listingId,
  initialFavorited,
}: {
  listingId: string;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOn(initialFavorited);
  }, [initialFavorited]);

  async function toggle() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.message("Sign in to save listings");
      router.push("/login?next=" + encodeURIComponent(`/listing/${listingId}`));
      return;
    }

    setLoading(true);
    try {
      if (on) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("listing_id", listingId)
          .eq("user_id", user.id);
        if (error) throw error;
        setOn(false);
        toast.success("Removed from saved");
      } else {
        const { error } = await supabase.from("favorites").insert({
          listing_id: listingId,
          user_id: user.id,
        });
        if (error) throw error;
        setOn(true);
        toast.success("Saved");
      }
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Could not update saved items");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
        on
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <Heart className={cn("h-4 w-4", on && "fill-current")} />
      {on ? "Saved" : "Save"}
    </button>
  );
}
