import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createPasswordSignup } from "@/lib/api/karta.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, ArrowLeft, KeyRound } from "lucide-react";

export const Route = createFileRoute("/create-password")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: (search.email as string) || "",
    };
  },
  component: CreatePasswordPage,
});

function CreatePasswordPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const signup = useServerFn(createPasswordSignup);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error("Email is missing. Please go back to the login page.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({ data: { email, password } });
      if (res.success) {
        toast.success("Account password created successfully! Please check your email to verify your account, then log in.");
        navigate({ to: "/login" });
      } else {
        toast.error(res.error || "Failed to create password.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
        
        <div className="mb-6 flex items-center gap-2 text-primary">
          <Briefcase className="h-5 w-5" />
          <span className="font-semibold">Karta Connect</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Create Password</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Set a secure password for your new Karta Connect account associated with <span className="font-medium text-foreground">{email}</span>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter password"
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading || !password || !confirmPassword}>
            {loading ? "Registering..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
