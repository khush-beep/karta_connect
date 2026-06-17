import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getResumeDownloadUrl } from "@/lib/storage-paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, BookOpen, Award, FileText, ExternalLink } from "lucide-react";
export const Route = createFileRoute("/_authenticated/students/$id")({
    component: StudentDetails,
});
function StudentDetails() {
    const { id: profileId } = Route.useParams();
    const [profile, setProfile] = useState(null);
    const [resumeDownloadUrl, setResumeDownloadUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    function normalizeUrl(url) {
      if (!url) return null;
      return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    }
    useEffect(() => {
        async function loadProfile() {
            if (!profileId)
                return;
            setLoading(true);
            setError("");
            try {
                const { data, error } = await supabase
                    .from("student_profiles")
                    .select("*")
                    .eq("user_id", profileId)
                    .maybeSingle();
                if (error)
                    throw error;
                if (!data) {
                    setError("Student profile not found.");
                    setProfile(null);
                }
                else {
                    setProfile(data);
                }
            }
            catch (err) {
                console.error("Error loading student profile:", err);
                setError(err.message || "Failed to load student profile.");
            }
            finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [profileId]);

    useEffect(() => {
        let canceled = false;
        async function loadResumeUrl() {
            if (!profile?.resume_url) {
                setResumeDownloadUrl(null);
                return;
            }
            const url = await getResumeDownloadUrl(profile.resume_url, supabase);
            if (!canceled) {
                setResumeDownloadUrl(url);
            }
        }
        loadResumeUrl();
        return () => {
            canceled = true;
        };
    }, [profile?.resume_url]);
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (error || !profile) {
        return (<div className="text-center py-12">
        <h3 className="font-bold text-lg">Student profile not found</h3>
        <p className="text-sm text-muted-foreground mt-1">This profile may not exist or may be unavailable right now.</p>
        <Link to="/dashboard" className="mt-4 inline-block"><Button>Back to Dashboard</Button></Link>
      </div>);
    }
    return (<div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatar_url ? (<img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover"/>) : (<User className="h-8 w-8 text-muted-foreground"/>)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name || "Unnamed Student"}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {profile.bio && (<Card>
              <CardHeader>
                <CardTitle>Professional Bio</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </CardContent>
            </Card>)}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/> Academic Information</CardTitle>
              <CardDescription>Core education details from the student profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">University</span>
                <span className="font-semibold">{profile.university || "Not specified"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Course</span>
                <span className="font-semibold">{profile.course || "Not specified"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Year</span>
                <span className="font-semibold">{profile.year_of_study || "Not specified"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Graduation Year</span>
                <span className="font-semibold">{profile.graduation_year || "Not specified"}</span>
              </div>
            </CardContent>
          </Card>

          {(profile.achievements || profile.extracurriculars) && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary"/> Achievements & Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {profile.achievements && (<div>
                    <span className="text-xs font-semibold text-foreground block">Achievements</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.achievements}</p>
                  </div>)}
                {profile.extracurriculars && (<div>
                    <span className="text-xs font-semibold text-foreground block">Extracurriculars</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.extracurriculars}</p>
                  </div>)}
              </CardContent>
            </Card>)}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Location</span>
                <span className="font-semibold">{profile.location || "Not specified"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-semibold">{profile.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Registered profile</span>
                <span className="font-semibold">{profileId}</span>
              </div>
            </CardContent>
          </Card>

          {(profile.github_url || profile.portfolio_url || profile.project_url) && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">External Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {profile.github_url && (<div>
                    <span className="text-xs text-muted-foreground block">GitHub</span>
                    <a href={normalizeUrl(profile.github_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      {profile.github_url}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>)}
                {profile.portfolio_url && (<div>
                    <span className="text-xs text-muted-foreground block">Portfolio</span>
                    <a href={normalizeUrl(profile.portfolio_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      {profile.portfolio_url}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>)}
                {profile.project_url && (<div>
                    <span className="text-xs text-muted-foreground block">Project</span>
                    <a href={normalizeUrl(profile.project_url)} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
                      {profile.project_url}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>)}
              </CardContent>
            </Card>)}

          <Card>
            <CardHeader>
              <CardTitle>Declared Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {profile.skills?.length > 0 ? (profile.skills.map((skill) => (<span key={skill} className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold capitalize">{skill}</span>))) : (<span className="text-xs text-muted-foreground">No skills listed.</span>)}
            </CardContent>
          </Card>

          {profile.resume_url && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={resumeDownloadUrl || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5">
                  {resumeDownloadUrl ? (<>View Resume <ExternalLink className="ml-2 h-4 w-4"/></>) : "Loading resume..."}
                </a>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>);
}
