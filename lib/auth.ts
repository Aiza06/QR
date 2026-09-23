import type { Session, User } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";

import { ensureProfile } from "./profiles";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let globalState: AuthState = {
  session: null,
  user: null,
  loading: true,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function setAuth(session: Session | null) {
  globalState = {
    session,
    user: session?.user ?? null,
    loading: false,
  };
  notify();
}

let authListenerStarted = false;

function ensureAuthListener() {
  if (authListenerStarted) return;
  authListenerStarted = true;

  const persist = (session: Session | null) => {
    setAuth(session);
    if (session) {
      ensureProfile(session.user).catch(() => {});
    }
  };

  supabase.auth.onAuthStateChange((_event, session) => {
    persist(session);
  });
  supabase.auth.getSession().then(({ data }) => {
    persist(data.session);
  });
}

function subscribe(onStoreChange: () => void) {
  ensureAuthListener();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): AuthState {
  return globalState;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export type SignUpProfile = {
  full_name: string;
  role: "student" | "teacher";
};

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: profile
      ? {
          data: {
            full_name: profile.full_name,
            role: profile.role,
          },
        }
      : undefined,
  });
  if (!error && data.user && profile) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email ?? "",
        full_name: profile.full_name,
        role: profile.role,
      },
      { onConflict: "id" },
    );
  }
  if (!error && data.session) {
    setAuth(data.session);
  }
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error && data.session) {
    setAuth(data.session);
    ensureProfile(data.session.user).catch(() => {});
  }
  return { data, error };
}

export async function signOut() {
  setAuth(null);
  supabase.auth.signOut().catch(() => {});
  return { error: null };
}
