import { createClient } from "@supabase/supabase-js";
// Conditionally load 'ws' for Node.js WebSocket support under SSR
const wsModule = typeof window === "undefined" ? "ws" : null;
const ws = wsModule ? (await import(/* @vite-ignore */ wsModule)).default : null;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
    },
    ...(ws ? { realtime: { transport: ws } } : {}),
});
