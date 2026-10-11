"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/dal";

/* ============================================================
   Profile mutations. Unlike audits (immutable under RLS), the
   profiles table has a `profiles_update_own` policy
   (using id = auth.uid()), so a user can update their own row
   through the standard RLS client — no service-role needed. We
   still validate inputs and scope the write to the caller's id.
   ============================================================ */

export type ProfileResult = { error?: string; fieldError?: string; ok?: boolean };

const NameSchema = z
  .string()
  .trim()
  .max(80, "Name must be 80 characters or fewer.");

// Empty is allowed (clears the avatar); otherwise require an http(s) URL.
const AvatarSchema = z
  .string()
  .trim()
  .max(2048, "That URL is too long.")
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    "Enter a valid image URL (http or https).",
  );

/** Update the current user's display name and avatar URL. */
export async function updateProfile(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await requireUser("/dashboard/settings");

  const nameParsed = NameSchema.safeParse(formData.get("full_name") ?? "");
  if (!nameParsed.success) {
    return { fieldError: nameParsed.error.issues[0]?.message ?? "Invalid name." };
  }
  const avatarParsed = AvatarSchema.safeParse(formData.get("avatar_url") ?? "");
  if (!avatarParsed.success) {
    return {
      fieldError: avatarParsed.error.issues[0]?.message ?? "Invalid avatar URL.",
    };
  }

  // Store empty strings as null so the column stays clean.
  const full_name = nameParsed.data === "" ? null : nameParsed.data;
  const avatar_url = avatarParsed.data === "" ? null : avatarParsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, avatar_url })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save your profile. Try again." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
