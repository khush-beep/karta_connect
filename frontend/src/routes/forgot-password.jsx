import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
export const Route = createFileRoute("/forgot-password")({
    head: () => ({ meta: [{ title: "Forgot Password — Karta Connect" }] }),
    component: ForgotPassword,
});
function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (!email)
            return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: window.location.origin + "/reset-password",
            });
            if (error)
                throw error;
            setSuccess(true);
            toast.success("Password recovery link sent successfully!");
        }
        catch (err) {
            toast.error(err.message || "Failed to request password reset.");
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5"/> Back to Sign In
        </Link>

        <div className="mb-6 flex items-center gap-2.5 text-primary">
          <div className="bg-primary/10 rounded-xl p-2">
            <KeyRound className="h-5 w-5 text-primary"/>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-foreground">Karta Connect</span>
        </div>

        {!success ? (<>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reset Password</h1>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium leading-relaxed">
              Enter your registered email address, and we will send you a secure link to reset your account password.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground font-semibold mb-1.5 block">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="email" type="email" placeholder="student@karta.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 focus-visible:ring-primary focus-visible:border-primary" autoFocus/>
                </div>
              </div>

              <Button type="submit" className="w-full font-bold shadow-md bg-zinc-950 text-zinc-50 hover:bg-zinc-900 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors mt-2" disabled={loading || !email}>
                {loading ? "Sending link…" : "Send Reset Link"}
              </Button>
            </form>
          </>) : (<div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto bg-emerald-500/10 rounded-full p-4 w-fit border border-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500"/>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">Check Your Email</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                We have dispatched a password recovery message to <span className="font-semibold text-foreground">{email}</span>. Click the link inside the email to choose a new password.
              </p>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Return to login</Link>
              </Button>
            </div>
          </div>)}
      </div>
    </div>);
}
