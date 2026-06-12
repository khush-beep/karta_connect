import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
let cached = { loading: true, user: null, role: null };
const listeners = new Set();
async function refresh(user) {
    if (!user) {
        cached = { loading: false, user: null, role: null };
    }
    else {
        const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();
        cached = { loading: false, user, role: data?.role ?? null };
    }
    listeners.forEach((l) => l(cached));
}
let initialized = false;
function init() {
    if (initialized)
        return;
    initialized = true;
    supabase.auth.getUser().then(({ data }) => refresh(data.user));
    supabase.auth.onAuthStateChange((_e, session) => {
        refresh(session?.user ?? null);
    });
}
export function useAuth() {
    const [state, setState] = useState(cached);
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
