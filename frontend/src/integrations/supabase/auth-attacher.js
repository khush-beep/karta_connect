import { createMiddleware } from "@tanstack/react-start";
export const attachSupabaseAuth = createMiddleware().server(async ({ next }) => {
    // Simple pass-through middleware for Supabase auth integration
    return next();
});
