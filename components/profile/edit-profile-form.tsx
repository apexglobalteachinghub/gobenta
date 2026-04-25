"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  AVATAR_IMAGE_MAX_INPUT_BYTES,
  processRasterImageForUpload,
  RASTER_IMAGE_ACCEPT,
  safeStorageFileName,
  validateRasterImageFile,
} from "@/lib/images/raster-image-upload";

export type ProfileFormInitial = {
  name: string;
  avatar_url: string | null;
  phone: string;
  address_public: string;
  government_id_type: string;
  government_id_last4: string;
  bio: string;
};

function ProfileAvatarPreview({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim() || "?").slice(0, 1).toUpperCase();

  if (!avatarUrl || broken) {
    return (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
        {initial}
      </span>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt=""
      fill
      className="object-cover"
      sizes="80px"
      onError={() => setBroken(true)}
    />
  );
}

export function EditProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [phone, setPhone] = useState(initial.phone);
  const [addressPublic, setAddressPublic] = useState(initial.address_public);
  const [govType, setGovType] = useState(initial.government_id_type);
  const [govLast4, setGovLast4] = useState(initial.government_id_last4);
  const [bio, setBio] = useState(initial.bio);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in");
      setPending(false);
      return;
    }
    const last4 = govLast4.trim().slice(-4);
    const { error } = await supabase
      .from("users")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        address_public: addressPublic.trim() || null,
        government_id_type: govType.trim() || null,
        government_id_last4: last4 || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.size) return;

    const check = validateRasterImageFile(file, {
      maxBytes: AVATAR_IMAGE_MAX_INPUT_BYTES,
    });
    if (!check.ok) {
      toast.error(check.message);
      e.target.value = "";
      return;
    }

    let processed: File;
    try {
      processed = await processRasterImageForUpload(file, "avatar");
    } catch (err) {
      console.error(err);
      toast.error("Could not process this photo. Try JPG or PNG.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not signed in");
      setUploading(false);
      return;
    }
    const path = `${user.id}/${crypto.randomUUID()}-${safeStorageFileName(processed.name)}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, processed, {
        upsert: false,
        cacheControl: "3600",
        contentType: processed.type || "image/jpeg",
      });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", user.id);
    setUploading(false);
    toast.success("Photo updated");
    router.refresh();
    e.target.value = "";
  }

  return (
    <form
      onSubmit={(e) => void save(e)}
      className="max-w-lg space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
          <ProfileAvatarPreview
            key={avatarUrl ?? "no-photo"}
            avatarUrl={avatarUrl}
            name={name}
          />
        </div>
        <label className="inline-flex cursor-pointer rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
          {uploading ? "Uploading…" : "Change photo"}
          <input
            type="file"
            accept={RASTER_IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => void onAvatarChange(e)}
            disabled={uploading}
          />
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Display name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Phone (shown on your public page)
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="09xx xxx xxxx"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          City / area (public)
        </label>
        <input
          value={addressPublic}
          onChange={(e) => setAddressPublic(e.target.value)}
          placeholder="e.g. San Pablo City, Laguna"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ID type (public label)
          </label>
          <input
            value={govType}
            onChange={(e) => setGovType(e.target.value)}
            placeholder="PhilSys, UMID, Driver's…"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ID last 4 characters only
          </label>
          <input
            value={govLast4}
            onChange={(e) => setGovLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            maxLength={4}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Short bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A sentence about what you buy or sell."
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Never upload a full government ID number. Only optional trust signals
        you are comfortable showing publicly.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        Save profile
      </button>
    </form>
  );
}
