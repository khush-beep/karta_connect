import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
export const Route = createFileRoute("/login")({
    head: () => ({ meta: [{ title: "Sign in — Karta Connect" }] }),
    component: LoginPage,
});
async function resolveEmail(email) {
    const res = await fetch("http://localhost:3001/api/auth/resolve-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Network error");
    }
    return res.json();
}
const bgImages = [
    "/student-presentation.png",
    "/student-group-monument.png",
    "/student-group-uniforms.png",
    "/student-group-classroom.png",
];
function BackgroundSlideshow() {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000); // Transition every 5 seconds
        return () => clearInterval(timer);
    }, []);
    return (<div className="absolute inset-0 overflow-hidden z-0">
      {bgImages.map((src, idx) => (<div key={src} className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${idx === index ? "opacity-100 scale-100" : "opacity-0 scale-105"}`} style={{ backgroundImage: `url('${src}')` }}/>))}
      {/* Dark gold-tinted overlay */}
      <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]"/>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/40"/>
    </div>);
}
function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [emailStatus, setEmailStatus] = useState({ state: "idle" });
    function isValidEmail(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }
    async function checkEmail(value) {
        const v = (value ?? email).trim();
        if (!isValidEmail(v)) {
            setEmailStatus({ state: "invalid" });
            return;
        }
        setChecking(true);
        try {
            const info = await resolveEmail(v);
            if (info.kind === null) {
                setEmailStatus({ state: "invalid" });
            }
            else {
                setEmailStatus({ state: "valid", hasPassword: info.hasPassword });
            }
        }
        catch {
            setEmailStatus({ state: "invalid" });
        }
        finally {
            setChecking(false);
        }
    }
    // Debounced live validation as the user types
    const debounceRef = useRef(null);
    useEffect(() => {
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        if (!email) {
            setEmailStatus({ state: "idle" });
            return;
        }
        debounceRef.current = setTimeout(() => { checkEmail(email); }, 500);
        return () => { if (debounceRef.current)
            clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);
    async function onSubmit(e) {
        e.preventDefault();
        if (emailStatus.state !== "valid") {
            await checkEmail();
            return;
        }
        if (!emailStatus.hasPassword) {
            navigate({ to: "/create-password", search: { email } });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error(error.message);
                return;
            }
            toast.success("Welcome back");
            navigate({ to: "/dashboard" });
        }
        catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed");
        }
        finally {
            setLoading(false);
        }
    }
    async function goCreatePassword() {
        if (!email)
            return toast.error("Enter your email first");
        const info = await resolveEmail(email);
        if (info.kind === null)
            return toast.error("Invalid Email");
        if (info.hasPassword)
            return toast.error("Password already exists. Use Forgot Password to reset.");
        navigate({ to: "/create-password", search: { email } });
    }
    const emailValid = emailStatus.state === "valid";
    const emailInvalid = emailStatus.state === "invalid";
    return (<div className="flex min-h-screen w-full bg-background font-sans">
      {/* Left side banner (visible on desktop) */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center p-8 overflow-hidden border-r">
        <BackgroundSlideshow />

        <div className="relative max-w-md text-center space-y-6 animate-in fade-in slide-in-from-left duration-700 z-10">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center justify-center max-w-xs mx-auto border border-white/10">
            <img src="/karta-logo.png" className="w-full h-auto object-contain max-h-[110px]" alt="Karta Initiative Logo"/>
          </div>
          <div className="space-y-2 text-white">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Karta Connect</h2>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              A professional matching and opportunity network built specifically for Karta Scholars, mentors, and partner organizations.
            </p>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in fade-in slide-in-from-right duration-700">
          <Link to="/" className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5"/> Back to Home
          </Link>
          
          <div className="mb-6 flex md:hidden items-center justify-center">
            <div className="bg-white rounded-xl p-3 shadow-md border border-slate-100 flex items-center justify-center">
              <img src="/karta-logo.png" className="h-10 w-auto object-contain" alt="Karta Initiative Logo"/>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1.5 text-xs text-muted-foreground font-medium leading-relaxed">
            Scholars, corporate partners, and administrators use the same portal. Access permissions are automatically checked from your credentials.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground font-semibold mb-1 block">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => {
            setEmail(e.target.value);
            if (emailStatus.state !== "idle")
                setEmailStatus({ state: "idle" });
        }} onBlur={() => { if (email)
        checkEmail(); }} required aria-invalid={emailInvalid} className="focus-visible:ring-primary focus-visible:border-primary"/>
              {emailInvalid && (<p className="mt-1 text-xs text-destructive font-medium">Invalid Email — not registered with Karta.</p>)}
              {emailValid && !emailStatus.hasPassword && (<p className="mt-1.5 text-xs text-muted-foreground">
                  First-time login. <button type="button" onClick={goCreatePassword} className="text-primary hover:underline font-semibold">Create your password</button>.
                </p>)}
            </div>
            {emailValid && emailStatus.hasPassword && (<div>
                <p className="text-xs text-muted-foreground mb-1.5 font-medium">Enter password below to continue.</p>
                <Label htmlFor="password" className="text-foreground font-semibold mb-1 block">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus className="focus-visible:ring-primary focus-visible:border-primary"/>
              </div>)}
            {!emailValid ? (<Button type="button" className="w-full font-bold shadow-md bg-zinc-950 text-zinc-50 hover:bg-zinc-900 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors" disabled={checking || !email} onClick={() => checkEmail()}>
                {checking ? "Checking…" : "Continue"}
              </Button>) : emailStatus.hasPassword ? (<Button type="submit" className="w-full font-bold shadow-md bg-zinc-950 text-zinc-50 hover:bg-zinc-900 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors" disabled={loading}>
                {loading ? "Signing in…" : "Login"}
              </Button>) : (<Button type="button" className="w-full font-bold shadow-md bg-zinc-950 text-zinc-50 hover:bg-zinc-900 focus-visible:ring-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors" onClick={goCreatePassword}>
                Create Password
              </Button>)}
          </form>
          <div className="mt-6 flex items-center justify-between text-xs border-t border-border pt-4 font-bold">
            <button type="button" onClick={goCreatePassword} className="text-muted-foreground hover:text-foreground transition-colors">
              Create Password
            </button>
            <Link to="/forgot-password" lg-attr="forgot" className="text-muted-foreground hover:text-foreground transition-colors">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>);
}
