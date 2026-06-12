import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, FileText, Loader2, Send, AlertTriangle } from "lucide-react";
export const Route = createFileRoute("/_authenticated/student/jobs/$id/apply")({
    component: JobApplyPage,
});
function JobApplyPage() {
    const { id: jobId } = Route.useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // Form input
    const [coverNote, setCoverNote] = useState("");
    useEffect(() => {
        async function loadApplyData() {
            if (!user || !jobId)
                return;
            setLoading(true);
            try {
                const [jobRes, profileRes] = await Promise.all([
                    supabase
                        .from("job_posts")
                        .select("*, company:companies(name)")
                        .eq("id", jobId)
                        .maybeSingle(),
                    supabase
                        .from("student_profiles")
                        .select("*")
                        .eq("user_id", user.id)
                        .maybeSingle()
                ]);
                if (jobRes.data)
                    setJob(jobRes.data);
                if (profileRes.data)
                    setProfile(profileRes.data);
            }
            catch (err) {
                console.error("Error loading application setup data:", err);
                toast.error("Failed to load details.");
            }
            finally {
                setLoading(false);
            }
        }
        loadApplyData();
    }, [user, jobId]);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!user || !jobId)
            return;
        if (!profile?.name || !profile?.university || !profile?.course) {
            toast.error("Please fill required fields in your profile first.");
            return;
        }
        if (!profile?.resume_url) {
            toast.error("Please upload a resume in your profile page before applying.");
            return;
        }
        setSubmitting(true);
        try {
            // Create new application
            const { error } = await supabase.from("applications").insert({
                post_id: jobId,
                student_id: user.id,
                status: "applied",
                cover_note: coverNote.trim() || null
            });
            if (error) {
                if (error.code === "23505") {
                    toast.error("You have already applied to this posting.");
                }
                else {
                    throw error;
                }
            }
            else {
                toast.success("Application submitted successfully!");
                navigate({ to: "/student/applications" });
            }
        }
        catch (err) {
            toast.error(err.message || "Failed to submit application.");
        }
        finally {
            setSubmitting(false);
        }
    }
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!job) {
        return (<div className="text-center py-12">
        <h3 className="font-bold text-lg">Listing not found</h3>
        <p className="text-sm text-muted-foreground mt-1">The job opening may have been archived.</p>
        <Link to="/student/jobs" search={{}} className="mt-4 inline-block"><Button>Back to Listings</Button></Link>
      </div>);
    }
    const isProfileIncomplete = !profile?.name || !profile?.university || !profile?.course;
    const isResumeMissing = !profile?.resume_url;
    return (<div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <Link to="/student/jobs" search={{}} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4"/> Back to job search
      </Link>

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-primary"/>
            <div>
              <CardTitle className="text-xl">Apply for {job.title}</CardTitle>
              <CardDescription>{job.company?.name || "Corporate Partner"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Warning Banner */}
          {(isProfileIncomplete || isResumeMissing) && (<div className="flex items-start gap-3 bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5"/>
              <div className="space-y-1">
                <span className="font-bold">Missing Application Requirements</span>
                <p className="text-xs">
                  {isProfileIncomplete && "• Your student profile is incomplete (Name, University, and Course are required). "}
                  {isResumeMissing && "• No resume document has been uploaded. "}
                  Please go to your <Link to="/student/profile" className="underline font-semibold hover:text-destructive/80">Profile Settings</Link> to complete these requirements.
                </p>
              </div>
            </div>)}

          {/* Prefilled Fields (Read-Only Summary) */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground">Applicant Summary</h3>
            <div className="grid gap-3 bg-muted/40 p-4 rounded-xl text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{profile?.name || "Missing details"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">University</span>
                <span className="font-medium">{profile?.university || "Missing details"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium">{profile?.course || "Missing details"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resume</span>
                <span className="font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4"/> {profile?.resume_url ? "Uploaded" : "Missing document"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cover-note">Motivation / Cover Note (Optional)</Label>
              <textarea id="cover-note" placeholder="Describe why you are interested in this role and why you are a good fit..." value={coverNote} onChange={(e) => setCoverNote(e.target.value)} className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" disabled={isProfileIncomplete || isResumeMissing}/>
            </div>

            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={submitting || isProfileIncomplete || isResumeMissing}>
              {submitting ? (<>Submitting...</>) : (<>
                  Submit Application <Send className="h-4 w-4"/>
                </>)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>);
}
