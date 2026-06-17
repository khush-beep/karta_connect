import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, User, BookOpen, Award, FileText, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
export const Route = createFileRoute("/_authenticated/admin/students/$id")({
    component: AdminStudentProfileDetailsPage,
});
 async function getResumeUrl(filePath) {
        if (!filePath) return "";
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        try {
            const url = await getResumeDownloadUrl(filePath, supabase);
            return url || "";
        } catch (err) {
            console.error("Error generating resume URL:", err);
            return "";
        }
  }
function AdminStudentProfileDetailsPage() {
    const { id: profileId } = Route.useParams();
    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alteringStatus, setAlteringStatus] = useState(false);
    async function loadData() {
        if (!profileId)
            return;
        setLoading(true);
        try {
            const [profileRes, appsRes] = await Promise.all([
                supabase
                    .from("student_profiles")
                    .select("*")
                    .eq("user_id", profileId)
                    .maybeSingle(),
                supabase
                    .from("applications")
                    .select("*, job_post:job_posts(title, company:companies(name))")
                    .eq("student_id", profileId)
                    .order("applied_at", { ascending: false })
            ]);
            if (profileRes.data)
                setProfile(profileRes.data);
            setApplications(appsRes.data || []);
        }
        catch (err) {
            console.error("Error loading student details:", err);
            toast.error("Failed to load details.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, [profileId]);
    async function toggleBlock() {
        if (!profile)
            return;
        setAlteringStatus(true);
        try {
            const { error } = await supabase
                .from("student_profiles")
                .update({ blocked: !profile.blocked })
                .eq("user_id", profileId);
            if (error)
                throw error;
            toast.success(`Student successfully ${!profile.blocked ? "blocked" : "unblocked"}!`);
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to update block state.");
        }
        finally {
            setAlteringStatus(false);
        }
    }
    function getResumeDownloadUrl(filePath) {
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
        return data.publicUrl;

    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!profile) {
        return (<div className="text-center py-12">
        <h3 className="font-bold text-lg">Student profile not found</h3>
        <p className="text-sm text-muted-foreground mt-1">This user may have deleted their account.</p>
        <Link to="/admin/students" className="mt-4 inline-block"><Button>Back to Directory</Button></Link>
      </div>);
    }
    return (<div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4"/> Back to Directory
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatar_url ? (<img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover"/>) : (<User className="h-8 w-8 text-muted-foreground"/>)}
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.name}
              {profile.blocked && (<span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  Blocked
                </span>)}
            </h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <Button onClick={toggleBlock} variant={profile.blocked ? "default" : "destructive"} disabled={alteringStatus}>
          {profile.blocked ? (<>
              <ShieldCheck className="h-4 w-4 mr-2"/> Unblock Student
            </>) : (<>
              <ShieldAlert className="h-4 w-4 mr-2"/> Block Student
            </>)}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: profile details */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio / Summary */}
          {profile.bio && (<Card>
              <CardHeader>
                <CardTitle>Professional Bio</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </CardContent>
            </Card>)}

          {/* Academic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary"/> Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">University</span>
                <span className="font-semibold">{profile.university}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Course of study</span>
                <span className="font-semibold">{profile.course}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Current Year</span>
                <span className="font-semibold">{profile.year_of_study}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Graduation Year</span>
                <span className="font-semibold">{profile.graduation_year}</span>
              </div>
            </CardContent>
          </Card>

          {/* Accomplishments */}
          {(profile.achievements || profile.extracurriculars) && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary"/> Accomplishments & Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {profile.achievements && (<div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground block">Achievements & Certificates</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.achievements}</p>
                  </div>)}
                {profile.extracurriculars && (<div className="space-y-1 border-t pt-3">
                    <span className="text-xs font-semibold text-foreground block">Extracurricular Activities</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.extracurriculars}</p>
                  </div>)}
              </CardContent>
            </Card>)}

          {/* Application history */}
          <Card>
            <CardHeader>
              <CardTitle>Application History</CardTitle>
              <CardDescription>Role submissions tracked in the portal.</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (<div className="text-center py-4 text-xs text-muted-foreground">No applications found.</div>) : (<div className="space-y-3">
                  {applications.map((app) => (<div key={app.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{app.job_post?.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{app.job_post?.company?.name}</p>
                      </div>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize font-semibold border">
                        {app.status}
                      </span>
                    </div>))}
                </div>)}
            </CardContent>
          </Card>
        </div>

        {/* Right column: skills & files */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Declared Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {profile.skills?.length > 0 ? (profile.skills.map((skill) => (<span key={skill} className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                    {skill}
                  </span>))) : (<span className="text-xs text-muted-foreground">No skills listed.</span>)}
            </CardContent>
          </Card>

          {profile.resume_url && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5"><FileText className="h-5 w-5"/> Resume Document</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Preview candidate's uploaded resume document.</p>
                <a href={getResumeDownloadUrl(profile.resume_url)} target="_blank" rel="noopener noreferrer" className="w-full block">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                    View Resume <ExternalLink className="h-4 w-4"/>
                  </Button>
                </a>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>);
}
