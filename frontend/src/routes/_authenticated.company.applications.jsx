import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User, FileText, Info, ExternalLink } from "lucide-react";
export const Route = createFileRoute("/_authenticated/company/applications")({
    component: CompanyApplicationsPage,
});
function CompanyApplicationsPage() {
    const { user } = useAuth();
    const [company, setCompany] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    async function loadData() {
        if (!user)
            return;
        setLoading(true);
        try {
            const { data: comp } = await supabase
                .from("companies")
                .select("*")
                .eq("owner_user_id", user.id)
                .maybeSingle();
            if (comp) {
                setCompany(comp);
                // Fetch applications matching company's job postings
                const { data: list, error: appsError } = await supabase
                    .from("applications")
                    .select("*, job_post:job_posts!inner(*), student:student_profiles(*)")
                    .eq("job_posts.company_id", comp.id)
                    .order("applied_at", { ascending: false });
                if (appsError)
                    throw appsError;
                setApplications(list || []);
            }
        }
        catch (err) {
            console.error("Error loading company applicants:", err);
            toast.error("Failed to load applicants data.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, [user]);
    async function handleStatusChange(appId, newStatus) {
        try {
            const { error } = await supabase
                .from("applications")
                .update({ status: newStatus })
                .eq("id", appId);
            if (error)
                throw error;
            toast.success(`Applicant status updated to ${newStatus}!`);
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to update status.");
        }
    }
    function getResumeDownloadUrl(filePath) {
        // If the path contains the full URL already, return it directly
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return filePath;
        }
        const { data } = supabase.storage.from("resumes").getPublicUrl(filePath);
        return data.publicUrl;
    }
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!company) {
        return (<Card className="max-w-xl mx-auto mt-12">
        <CardHeader>
          <CardTitle>Initialize Profile First</CardTitle>
          <CardDescription>Setup your company name and settings before tracking candidates.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/company/profile"><Button>Complete Profile</Button></Link>
        </CardContent>
      </Card>);
    }
    const statusStyles = {
        applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        selected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        rejected: "bg-destructive/10 text-destructive border-destructive/20"
    };
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Candidate Submissions</h1>
        <p className="text-muted-foreground">Review applications, preview resumes, and manage candidates status.</p>
      </div>

      {applications.length === 0 ? (<Card className="border-dashed py-12 text-center max-w-xl mx-auto">
          <CardHeader>
            <User className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
            <CardTitle>No applications received</CardTitle>
            <CardDescription>You haven't received any candidate applications for your postings yet.</CardDescription>
          </CardHeader>
        </Card>) : (<div className="space-y-4 max-w-4xl">
          {applications.map((app) => (<Card key={app.id}>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full border bg-muted flex items-center justify-center overflow-hidden shrink-0 mt-1">
                      {app.student?.avatar_url ? (<img src={app.student.avatar_url} alt={app.student.name} className="h-full w-full object-cover"/>) : (<User className="h-6 w-6 text-muted-foreground"/>)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{app.student?.name || "Karta Scholar"}</h3>
                      <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                        {app.student?.university} • {app.student?.course} ({app.student?.year_of_study})
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="font-semibold text-foreground">Role: {app.job_post?.title}</span>
                        <span>•</span>
                        <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`status-${app.id}`} className="text-xs text-muted-foreground shrink-0">Status:</Label>
                      <select id={`status-${app.id}`} value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)} className="flex h-8 rounded-md border border-input bg-background px-2.5 py-0.5 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium">
                        <option value="applied">Applied</option>
                        <option value="review">Under Review</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <span className={`text-[10px] border px-2 py-1 rounded-full uppercase font-bold tracking-wider ${statusStyles[app.status] || "bg-muted text-muted-foreground"}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Candidate Motivation & Skills */}
                <div className="grid gap-4 sm:grid-cols-2 text-sm pt-2">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-foreground flex items-center gap-1.5"><Info className="h-4 w-4"/> Cover Note</h4>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      {app.cover_note ? `"${app.cover_note}"` : "No cover note provided."}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">Candidate Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {app.student?.skills?.length > 0 ? (app.student.skills.map((skill) => (<span key={skill} className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold capitalize text-muted-foreground">
                            {skill}
                          </span>))) : (<span className="text-xs text-muted-foreground">No skills declared.</span>)}
                    </div>
                  </div>
                </div>

                {/* Resume Download / Preview */}
                {app.student?.resume_url && (<div className="border-t pt-4 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary"/> Candidate resume attached
                    </span>
                    <a href={getResumeDownloadUrl(app.student.resume_url)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                        View Resume <ExternalLink className="h-3.5 w-3.5"/>
                      </Button>
                    </a>
                  </div>)}
              </CardContent>
            </Card>))}
        </div>)}
    </div>);
}
