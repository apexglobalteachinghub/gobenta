"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { canonicalListingImagePublicUrl } from "@/lib/images/listing-image-url";
import {
  LISTING_IMAGE_MAX_COUNT,
  LISTING_IMAGE_MAX_EDGE_PX,
  LISTING_IMAGE_MAX_INPUT_BYTES,
  processRasterImageForUpload,
  RASTER_IMAGE_ACCEPT,
  safeStorageFileName,
  validateRasterImageFile,
} from "@/lib/images/raster-image-upload";
import type { CategoryRow, ListingCondition, PaymentOption } from "@/types/database";

type Props = {
  mainCategories: CategoryRow[];
  allCategories: CategoryRow[];
};

const PAY_OPTIONS: { key: PaymentOption; label: string }[] = [
  { key: "gcash", label: "GCash" },
  { key: "maya", label: "Maya" },
  { key: "cod", label: "Cash on delivery (COD)" },
];

export function CreateListingForm({ mainCategories, allCategories }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [categoryId, setCategoryId] = useState(mainCategories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [payments, setPayments] = useState<PaymentOption[]>(["cod"]);

  const subs = useMemo(
    () => allCategories.filter((c) => c.parent_id === categoryId),
    [allCategories, categoryId]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const title = String(fd.get("title") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const price = Number(fd.get("price"));
    const location = String(fd.get("location") ?? "").trim();
    const barangay = String(fd.get("barangay") ?? "").trim() || null;
    const city = String(fd.get("city") ?? "").trim() || null;
    const province = String(fd.get("province") ?? "").trim() || null;
    const condition = String(fd.get("condition") ?? "used") as ListingCondition;
    const pasabuy = fd.get("pasabuy") === "on";
    const tagStr = String(fd.get("tags") ?? "");
    const tags = tagStr
      .split(/[,#]/g)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    if (!title || !description || Number.isNaN(price) || price < 0) {
      toast.error("Please fill title, description, and a valid price.");
      return;
    }
    if (!categoryId) {
      toast.error("Choose a category.");
      return;
    }

    const imageInput = form.querySelector(
      'input[name="images"]'
    ) as HTMLInputElement | null;
    const rawFiles = imageInput?.files?.length
      ? Array.from(imageInput.files).filter((f) => f.size > 0)
      : [];

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be signed in.");
      router.push("/login");
      return;
    }

    setPending(true);
    try {
      const processedFiles: File[] = [];
      for (const file of rawFiles.slice(0, LISTING_IMAGE_MAX_COUNT)) {
        const check = validateRasterImageFile(file, {
          maxBytes: LISTING_IMAGE_MAX_INPUT_BYTES,
        });
        if (!check.ok) {
          toast.error(check.message);
          return;
        }
        try {
          processedFiles.push(
            await processRasterImageForUpload(file, "listing")
          );
        } catch (err) {
          console.error(err);
          toast.error(
            `Could not process “${file.name}”. Try a different photo (JPG/PNG/WebP).`
          );
          return;
        }
      }

      const payment_options: PaymentOption[] = [...payments];
      if (pasabuy) payment_options.push("pasabuy");

      const { data: listing, error: le } = await supabase
        .from("listings")
        .insert({
          title,
          description,
          price,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          user_id: user.id,
          location,
          condition,
          tags,
          barangay,
          city,
          province,
          payment_options,
          pasabuy_available: pasabuy,
        })
        .select("id")
        .single();

      if (le || !listing) {
        console.error(le);
        toast.error(le?.message ?? "Could not create listing");
        return;
      }

      let sort = 0;
      for (const file of processedFiles) {
        const path = `${user.id}/${listing.id}/${crypto.randomUUID()}-${safeStorageFileName(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("listing-images")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
          });
        if (upErr) {
          console.error(upErr);
          toast.error("Image upload failed: " + upErr.message);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("listing-images").getPublicUrl(path);
        await supabase.from("images").insert({
          listing_id: listing.id,
          image_url: canonicalListingImagePublicUrl(publicUrl),
          sort_order: sort++,
        });
      }

      toast.success("Listing published");
      router.push(`/listing/${listing.id}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <input
          name="title"
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="What are you selling?"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          name="description"
          required
          rows={5}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Condition, inclusions, meet-up, etc."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Price (PHP)
          </label>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            required
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Condition
          </label>
          <select
            name="condition"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="new">Brand new</option>
            <option value="like_new">Like new</option>
            <option value="used">Used</option>
            <option value="for_parts">For parts</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            {mainCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Subcategory
          </label>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">None</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tags (comma-separated)
        </label>
        <input
          name="tags"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="e.g. honda, motorcycle, qc"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Location (meet-up / area)
        </label>
        <input
          name="location"
          required
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="e.g. SM North EDSA area"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Province
          </label>
          <input
            name="province"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Metro Manila"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            City
          </label>
          <input
            name="city"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Quezon City"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Barangay
          </label>
          <input
            name="barangay"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Optional — hyperlocal filter"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Payment options
        </legend>
        <div className="flex flex-wrap gap-3">
          {PAY_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={payments.includes(key)}
                onChange={() => {
                  setPayments((p) =>
                    p.includes(key) ? p.filter((x) => x !== key) : [...p, key]
                  );
                }}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" name="pasabuy" />
          Highlight &quot;Pasabuy&quot; on listing card
        </label>
      </fieldset>

      <div>
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Photos (up to {LISTING_IMAGE_MAX_COUNT})
        </span>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-200/90 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
          Choose photos
          <input
            name="images"
            type="file"
            accept={RASTER_IMAGE_ACCEPT}
            multiple
            className="sr-only"
          />
        </label>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          JPG, PNG, WebP, GIF, or HEIC — max{" "}
          {Math.round(LISTING_IMAGE_MAX_INPUT_BYTES / (1024 * 1024))} MB each
          before processing. We resize (long edge {LISTING_IMAGE_MAX_EDGE_PX}px) and
          compress so each stored photo stays small (typically under ~1.2 MB) for
          fast listing pages.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Optimizing & publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
