import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, Calendar, Info, Loader2 } from "lucide-react";
export const Route = createFileRoute("/_authenticated/student/applications")({
    component: StudentApplicationsPage,
});
function StudentApplicationsPage() {
    const { user } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    useEffect(() => {
        async function loadApplications() {
            if (!user)
                return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("applications")
                    .select("*, job_post:job_posts(*, company:companies(name, logo_url))")
                    .eq("student_id", user.id)
                    .order("applied_at", { ascending: false });
                if (error)
                    throw error;
                setApps(data || []);
            }
            catch (err) {
                console.error("Error loading applications:", err);
            }
            finally {
                setLoading(false);
            }
        }
        loadApplications();
    }, [user]);
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    const statusStyles = {
        applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        selected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        rejected: "bg-destructive/10 text-destructive border-destructive/20"
    };
    const statusLabels = {
      applied: "Applied",
      review: "Under Review",
      selected: "Shortlisted",
      rejected: "Rejected"
    };
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">Monitor the status of your submissions to corporate partners.</p>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2">
        {[
          { key: "", label: "All", style: "bg-muted" },
          { key: "applied", label: statusLabels.applied, style: "bg-blue-50 text-blue-600" },
          { key: "review", label: statusLabels.review, style: "bg-amber-50 text-amber-600" },
          { key: "selected", label: statusLabels.selected, style: "bg-emerald-50 text-emerald-600" },
          { key: "rejected", label: statusLabels.rejected, style: "bg-destructive/10 text-destructive" },
        ].map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(prev => prev === s.key ? "" : s.key)} className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusFilter === s.key ? "ring-2 ring-offset-1 ring-primary" : ""} ${s.style}`}>
            {s.label}
          </button>
        ))}
      </div>

      {apps.length === 0 ? (<Card className="border-dashed py-12 text-center max-w-xl mx-auto">
          <CardHeader>
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
            <CardTitle>No submissions yet</CardTitle>
            <CardDescription>You haven't applied to any job postings on the network.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/student/jobs" search={{}}><Button>Find verified jobs</Button></Link>
          </CardContent>
        </Card>) : (<div className="space-y-4 max-w-3xl">
          {apps.filter(a => !statusFilter || a.status === statusFilter).map((app) => (<Card key={app.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 border rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 mt-1">
                      {app.job_post?.company?.logo_url ? (<img src={app.job_post.company.logo_url} alt={app.job_post.company.name} className="h-full w-full object-cover"/>) : (<Briefcase className="h-6 w-6 text-muted-foreground"/>)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{app.job_post?.title}</h3>
                      <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                        {app.job_post?.company?.name}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5"/>
                          Applied: {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{app.job_post?.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
                    <span className={`text-xs border px-3 py-1 rounded-full capitalize font-semibold ${statusStyles[app.status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                  </div>
                </div>

                {app.cover_note && (<div className="mt-4 border-t pt-3 flex gap-2 text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
                    <Info className="h-4 w-4 shrink-0 text-primary mt-0.5"/>
                    <div>
                      <span className="font-semibold block mb-0.5">Your motivation cover note:</span>
                      <p className="italic">"{app.cover_note}"</p>
                    </div>
                  </div>)}
              </CardContent>
            </Card>))}
        </div>)}
    </div>);
}
