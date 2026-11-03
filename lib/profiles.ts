import type { User } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export type Role = "student" | "teacher" | "admin";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  student_number: string | null;
  employee_number: string | null;
  grade_level: string | null;
  section: string | null;
  department: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
};

function safeSignUpRole(role: unknown): "student" | "teacher" {
  return role === "teacher" ? "teacher" : "student";
}

export function profileFromUser(user: User): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name: (user.user_metadata?.full_name as string) ?? null,
    role: safeSignUpRole(user.user_metadata?.role),
    is_active: true,
    student_number: null,
    employee_number: null,
    grade_level: null,
    section: null,
    department: null,
    phone: null,
  };
}

/**
 * Make sure a profile row exists after authentication.
 *
 * Role and account status are deliberately NOT written here: they are
 * authoritative database values which only administrators may change.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const profile = profileFromUser(user);

  try {
    await supabase.from("profiles").upsert(
      {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  } catch {
    // Ignore: the in-memory profile still lets the app work.
  }

  return profile;
}

export async function getProfile(user: User): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, is_active, student_number, employee_number, grade_level, section, department, phone, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return ensureProfile(user);
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string },
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  return { error: error?.message ?? null };
}

export function displayName(
  profile: Pick<Profile, "full_name" | "email"> | null | undefined,
) {
  if (!profile) return "Unknown user";
  return profile.full_name?.trim() || profile.email || "Unknown user";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
