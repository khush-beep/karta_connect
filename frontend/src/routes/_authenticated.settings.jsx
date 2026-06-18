import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from "react";
import { useAuth, signOut } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Sun, Moon, Trash2, Loader2 } from "lucide-react";
import { authenticatedFetch } from "@/lib/api-client";
export const Route = createFileRoute("/_authenticated/settings")({
    component: SettingsPage,
});
async function deleteUserAccount(userId) {
    return authenticatedFetch("http://localhost:3001/api/account/delete", {
        method: "POST",
        body: JSON.stringify({ userId })
    });
}
function SettingsPage() {
    const { user, role } = useAuth();
    const [profileName, setProfileName] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [copyingUrl, setCopyingUrl] = useState(false);
    // Password state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatingPassword, setUpdatingPassword] = useState(false);
    // Recovery flow states
    const [passwordMode, setPasswordMode] = useState("normal");
    const [recoveryTarget, setRecoveryTarget] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [sentCode, setSentCode] = useState("");
    // Theme state
    const [theme, setTheme] = useState("light");
    useEffect(() => {
        // Get theme from HTML class or localStorage
        const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        setTheme(currentTheme);
        async function loadProfileName() {
            if (!user)
                return;
            setLoadingProfile(true);
            try {
                if (role === "student") {
                    const { data } = await supabase
                        .from("student_profiles")
                        .select("name")
                        .eq("user_id", user.id)
                        .maybeSingle();
                    if (data)
                        setProfileName(data.name || "");
                }
                else if (role === "company") {
                    const { data } = await supabase
                        .from("companies")
                        .select("name")
                        .eq("owner_user_id", user.id)
                        .maybeSingle();
                    if (data)
                        setProfileName(data.name || "");
                }
                else {
                    setProfileName("Karta Administrator");
                }
            }
            catch (err) {
                console.error("Error loading settings profile:", err);
            }
            finally {
                setLoadingProfile(false);
            }
        }
        loadProfileName();
        if (user && role === "student" && typeof window !== "undefined") {
            setShareUrl(`${window.location.origin}/students/${user.id}`);
        }
        else {
            setShareUrl("");
        }
    }, [user, role]);
    async function copyProfileUrl() {
        if (!shareUrl)
            return;
        setCopyingUrl(true);
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Profile URL copied to clipboard!");
        }
        catch (err) {
            console.error("Clipboard write failed:", err);
            toast.error("Unable to copy URL. Please copy it manually.");
        }
        finally {
            setCopyingUrl(false);
        }
    }
    async function handleProfileSave(e) {
        e.preventDefault();
        if (!user || role === "admin")
            return;
        setSavingProfile(true);
        try {
            if (role === "student") {
                const { error } = await supabase
                    .from("student_profiles")
                    .update({ name: profileName })
                    .eq("user_id", user.id);
                if (error)
                    throw error;
            }
            else if (role === "company") {
                const { error } = await supabase
                    .from("companies")
                    .update({ name: profileName })
                    .eq("owner_user_id", user.id);
                if (error)
                    throw error;
            }
            toast.success("Profile details updated successfully!");
        }
        catch (err) {
            toast.error(err.message || "Failed to update profile name.");
        }
        finally {
            setSavingProfile(false);
        }
    }
    async function handlePasswordUpdate(e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setUpdatingPassword(true);
        try {
            // Verify old password by attempting a re-authentication login
            const { error: reAuthError } = await supabase.auth.signInWithPassword({
                email: user?.email || "",
                password: oldPassword,
            });
            if (reAuthError) {
                throw new Error("Invalid old password. Verification failed.");
            }
            // Update password
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error)
                throw error;
            toast.success("Password updated successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
        catch (err) {
            toast.error(err.message || "Failed to update password.");
        }
        finally {
            setUpdatingPassword(false);
        }
    }
    function toggleTheme() {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        localStorage.setItem("theme", nextTheme);
        toast.success(`Theme switched to ${nextTheme} mode!`);
    }
    async function handleDeleteAccount() {
        if (!user)
            return;
        const confirmDelete = window.confirm("Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.");
        if (!confirmDelete)
            return;
        try {
            const res = await deleteUserAccount(user.id);
            if (res.success) {
                toast.success("Your account was successfully deleted.");
                await signOut();
                window.location.href = "/";
            }
            else {
                toast.error(res.error || "Failed to delete account.");
            }
        }
        catch (err) {
            toast.error(err.message || "Failed to complete account deletion.");
        }
    }
    if (loadingProfile) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your credentials, theme configuration, and account details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary"/> Profile Details
            </CardTitle>
            <CardDescription>Update your display name and view email identifiers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email-display">Email Address</Label>
                <Input id="email-display" type="email" value={user?.email || ""} disabled className="bg-muted cursor-not-allowed"/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name-input">Display Name</Label>
                <Input id="name-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} required disabled={role === "admin"}/>
              </div>
              {role !== "admin" && (<Button type="submit" className="w-full" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Details"}
                </Button>)}
            </form>
          </CardContent>
        </Card>

        {role === "student" && (<Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary"/> Profile Sharing
            </CardTitle>
            <CardDescription>Share a direct link to your student profile with other Karta users.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div className="grid gap-2">
              <Label htmlFor="share-url">Profile URL</Label>
              <Input id="share-url" value={shareUrl} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Anyone on the platform can open this URL to view your public student profile.
              </p>
            </div>
            <Button type="button" onClick={copyProfileUrl} disabled={!shareUrl || copyingUrl} className="h-11">
              {copyingUrl ? "Copying..." : "Copy Link"}
            </Button>
          </CardContent>
        </Card>)}

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary"/> Change Password
            </CardTitle>
            <CardDescription>
              {passwordMode === "normal" && "Establish a new secure access credential for this account."}
              {passwordMode === "recovery-input" && "Enter your contact details to recover your account."}
              {passwordMode === "recovery-verify" && "Verify the recovery code sent to your device."}
              {passwordMode === "recovery-reset" && "Enter your new credentials to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordMode === "normal" && (<form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="old-pwd">Old Password</Label>
                  <Input id="old-pwd" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required placeholder="Enter current password"/>
                  <button type="button" onClick={() => setPasswordMode("recovery-input")} className="text-left text-xs font-semibold text-primary hover:underline w-fit mt-1">
                    Forgot Password?
                  </button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input id="new-pwd" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min. 6 characters"/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                  <Input id="confirm-pwd" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter password"/>
                </div>
                <Button type="submit" className="w-full" disabled={updatingPassword}>
                  {updatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>)}

            {passwordMode === "recovery-input" && (<form onSubmit={(e) => {
                e.preventDefault();
                if (!recoveryTarget)
                    return;
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setSentCode(code);
                toast.info(`[Karta Recovery] Verification code: ${code}`, { duration: 15000 });
                setPasswordMode("recovery-verify");
            }} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="recovery-target">Email Address or Phone Number</Label>
                  <Input id="recovery-target" placeholder="Enter registered email or phone" value={recoveryTarget} onChange={(e) => setRecoveryTarget(e.target.value)} required autoFocus/>
                  <p className="text-xs text-muted-foreground mt-1">
                    We will send a 6-digit recovery code to this contact.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setPasswordMode("normal")}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Send Code
                  </Button>
                </div>
              </form>)}

            {passwordMode === "recovery-verify" && (<form onSubmit={(e) => {
                e.preventDefault();
                if (recoveryCode === sentCode) {
                    toast.success("Code verified successfully! Please set your new password.");
                    setPasswordMode("recovery-reset");
                }
                else {
                    toast.error("Incorrect verification code. Please try again.");
                }
            }} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="recovery-code">Verification Code</Label>
                  <Input id="recovery-code" placeholder="Enter 6-digit code" value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} required autoFocus maxLength={6}/>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your notifications for the code sent to <span className="font-semibold text-foreground">{recoveryTarget}</span>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setPasswordMode("recovery-input")}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Verify Code
                  </Button>
                </div>
              </form>)}

            {passwordMode === "recovery-reset" && (<form onSubmit={async (e) => {
                e.preventDefault();
                if (newPassword !== confirmPassword) {
                    toast.error("Passwords do not match.");
                    return;
                }
                if (newPassword.length < 6) {
                    toast.error("Password must be at least 6 characters.");
                    return;
                }
                setUpdatingPassword(true);
                try {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error)
                        throw error;
                    toast.success("Password recovered and updated successfully!");
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setRecoveryTarget("");
                    setRecoveryCode("");
                    setSentCode("");
                    setPasswordMode("normal");
                }
                catch (err) {
                    toast.error(err.message || "Failed to update password.");
                }
                finally {
                    setUpdatingPassword(false);
                }
            }} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-pwd-reset">New Password</Label>
                  <Input id="new-pwd-reset" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min. 6 characters" autoFocus/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-pwd-reset">Confirm New Password</Label>
                  <Input id="confirm-pwd-reset" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter password"/>
                </div>
                <Button type="submit" className="w-full" disabled={updatingPassword}>
                  {updatingPassword ? "Resetting..." : "Reset Password"}
                </Button>
              </form>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customization & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary"/> : <Sun className="h-5 w-5 text-primary"/>}
              Aesthetics & Theme
            </CardTitle>
            <CardDescription>Configure user interface look and contrast settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Dark Color Mode</h4>
                <p className="text-xs text-muted-foreground">Persist dark mode theme styling for this browser.</p>
              </div>
              <Button onClick={toggleTheme} variant="outline" size="sm">
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5"/> Danger Zone
            </CardTitle>
            <CardDescription className="text-destructive/80">Irreversible administrative actions for this profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-destructive">Delete Account</h4>
                <p className="text-xs text-destructive/80">Delete your user profile, credentials, and data entirely.</p>
              </div>
              <Button onClick={handleDeleteAccount} variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
