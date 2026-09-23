import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export type Role = "student" | "teacher";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

export function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string) ?? null,
    role: (user.user_metadata?.role as Role) ?? "student",
  };
}

export async function ensureProfile(user: User): Promise<Profile> {
  const profile = profileFromUser(user);

  try {
    await supabase.from("profiles").upsert(
      {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      },
      { onConflict: "id" },
    );
  } catch {
    // Ignore: the in-memory profile still lets the app work.
  }

  return profile;
}

export async function getProfile(user: User): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    return ensureProfile(user);
  }

  const stored = data as Profile;
  const metadata = profileFromUser(user);

  // Old rows (created before registration was fixed) may be missing the
  // name/role. Merge what the auth user knows back into the row.
  if (
    (stored.full_name ?? null) !== metadata.full_name ||
    stored.role !== metadata.role ||
    stored.email !== metadata.email
  ) {
    const merged: Profile = {
      id: stored.id,
      email: metadata.email || stored.email,
      full_name: metadata.full_name ?? stored.full_name,
      role: (metadata.role as Role) ?? stored.role,
    };

    try {
      await supabase
        .from("profiles")
        .update({
          email: merged.email,
          full_name: merged.full_name,
          role: merged.role,
        })
        .eq("id", user.id);
    } catch {
      // Ignore: the merged profile still displays correctly.
    }

    return merged;
  }

  return stored;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string; role?: Role },
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  return { error: error?.message ?? null };
}
