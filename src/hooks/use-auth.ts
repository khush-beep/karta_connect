import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "company" | "admin";

export interface AuthState {
  loading: boolean;
  user: User | null;
  role: AppRole | null;
}

let cached: AuthState = { loading: true, user: null, role: null };
const listeners = new Set<(s: AuthState) => void>();

async function refresh(user: User | null) {
  if (!user) {
    cached = { loading: false, user: null, role: null };
  } else {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    cached = { loading: false, user, role: (data?.role as AppRole) ?? null };
  }
  listeners.forEach((l) => l(cached));
}

let initialized = false;
function init() {
  if (initialized) return;
  initialized = true;
  supabase.auth.getUser().then(({ data }) => refresh(data.user));
  supabase.auth.onAuthStateChange((_e, session) => {
    refresh(session?.user ?? null);
  });
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(cached);
  useEffect(() => {
    init();
    listeners.add(setState);
    setState(cached);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

export async function signOut() {
  await supabase.auth.signOut();
}
