import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Briefcase, MapPin, Calendar, Building2, ExternalLink, Trash2, Award } from "lucide-react";
import { requireAdmin } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
    beforeLoad: requireAdmin,
    component: AdminPostDetailsPage,
});
function AdminPostDetailsPage() {
    const { id: postId } = Route.useParams();
    const [post, setPost] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);
    async function loadData() {
        if (!postId)
            return;
        setLoading(true);
        try {
            // 1. Fetch job post details and raw applications
            const [postRes, appsRes] = await Promise.all([
                supabase
                    .from("job_posts")
                    .select("*, company:companies(*)")
                    .eq("id", postId)
                    .maybeSingle(),
                supabase
                    .from("applications")
                    .select("*")
                    .eq("post_id", postId)
                    .order("applied_at", { ascending: false })
            ]);
            if (postRes.error) throw postRes.error;
            if (appsRes.error) throw appsRes.error;

            let appsData = appsRes.data || [];

            // 2. Fetch student profiles manually to resolve the schema cache relationship issue
            if (appsData.length > 0) {
                const studentIds = appsData.map(a => a.student_id);
                const studentsRes = await supabase
                    .from("student_profiles")
                    .select("*")
                    .in("user_id", studentIds);
                
                if (studentsRes.data) {
                    const sMap = {};
                    studentsRes.data.forEach(s => { sMap[s.user_id] = s; });
                    appsData = appsData.map(a => ({ ...a, student: sMap[a.student_id] }));
                }
            }

            setPost(postRes.data);
            setApplications(appsData);
        }
        catch (err) {
            console.error("Error loading post details:", err);
            toast.error(err.message || "Failed to load posting details.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, [postId]);
    async function updateApplicantStatus(appId, newStatus) {
        setUpdatingStatus(appId);
        try {
            const { error } = await supabase
                .from("applications")
                .update({ status: newStatus })
                .eq("id", appId);
            if (error)
                throw error;
            toast.success("Applicant status updated successfully!");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to update applicant status.");
        }
        finally {
            setUpdatingStatus(null);
        }
    }
    async function handleDeleteApplication(appId) {
        const confirmDelete = window.confirm("Are you sure you want to remove this student's application?");
        if (!confirmDelete)
            return;
        try {
            const { error } = await supabase.from("applications").delete().eq("id", appId);
            if (error)
                throw error;
            toast.success("Application removed successfully.");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to delete application.");
        }
    }
    function getResumeDownloadUrl(filePath) {
        if (!filePath)
            return "#";
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
    if (!post) {
        return (<div className="text-center py-12 space-y-4">
        <h3 className="font-bold text-lg">Posting not found</h3>
        <p className="text-sm text-muted-foreground mt-1">This listing may have been deleted.</p>
        <Link to="/admin/posts" className="inline-block">
          <Button>Back to Directory</Button>
        </Link>
      </div>);
    }
    // Calculate applications metrics
    const totalApps = applications.length;
    const appliedCount = applications.filter(a => a.status === "applied").length;
    const reviewCount = applications.filter(a => a.status === "review").length;
    const selectedCount = applications.filter(a => a.status === "selected").length;
    const rejectedCount = applications.filter(a => a.status === "rejected").length;
    return (<div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <Link to="/admin/posts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-medium">
        <ArrowLeft className="h-4 w-4"/> Back to Listings
      </Link>

      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{post.title}</h1>
            <span className={`text-[10px] border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${post.type === "job" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}>
              {post.type}
            </span>
            {!post.active && (<span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                Inactive
              </span>)}
          </div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Posted by <span className="text-primary">{post.company?.name || "Unknown Company"}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Job detail card & description */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary"/> Role Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block font-semibold">Location</span>
                <span className="font-semibold flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground"/> {post.location || "Remote"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block font-semibold">Application Deadline</span>
                <span className="font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground"/> {post.deadline}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Role Description & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {post.description}
            </CardContent>
          </Card>

          {/* Required Skills */}
          {post.required_skills?.length > 0 && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary"/> Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {post.required_skills.map((skill) => (<span key={skill} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold capitalize">
                    {skill}
                  </span>))}
              </CardContent>
            </Card>)}

          {/* Applicants Table Section */}
          <Card>
            <CardHeader>
              <CardTitle>Candidates & Applications</CardTitle>
              <CardDescription>Track status updates of students who applied for this role.</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (<div className="text-center py-6 text-sm text-muted-foreground font-medium">
                  No applications received yet for this listing.
                </div>) : (<div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>University / Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => {
                const hasResume = !!app.student?.resume_url;
                return (<TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              {app.student ? (<Link to="/admin/students/$id" params={{ id: app.student.user_id }} className="font-bold text-primary hover:underline">
                                  {app.student.name}
                                </Link>) : (<span className="font-semibold text-muted-foreground">Deleted Student</span>)}
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {app.student?.email}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {app.student ? (<>
                                  <div className="font-semibold text-foreground">{app.student.university}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{app.student.course}</div>
                                </>) : (<span className="text-muted-foreground">—</span>)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <select id={`status-${app.id}`} value={app.status} disabled={updatingStatus === app.id} onChange={(e) => updateApplicantStatus(app.id, e.target.value)} className="flex h-8 rounded-md border border-input bg-background px-2.5 py-0.5 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium uppercase tracking-wider">
                                  <option value="applied">Applied</option>
                                  <option value="review">Review</option>
                                  <option value="selected">Selected</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                {updatingStatus === app.id && (<Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground"/>)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              {hasResume && (<a href={getResumeDownloadUrl(app.student.resume_url)} target="_blank" rel="noopener noreferrer" title="View Resume Document" className="inline-block">
                                  <Button variant="outline" size="sm" className="h-8 px-2.5">
                                    <ExternalLink className="h-3.5 w-3.5"/>
                                  </Button>
                                </a>)}
                              <Button onClick={() => handleDeleteApplication(app.id)} variant="destructive" size="sm" className="h-8 px-2.5" title="Remove application">
                                <Trash2 className="h-3.5 w-3.5"/>
                              </Button>
                            </TableCell>
                          </TableRow>);
            })}
                    </TableBody>
                  </Table>
                </div>)}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Company info & metrics breakdown */}
        <div className="space-y-6">
          {/* Status Breakdown Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Applications Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="font-semibold text-muted-foreground">Total Submissions</span>
                <span className="font-bold text-lg">{totalApps}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-500">Applied</span>
                  <span className="bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20 px-2 py-0.5 rounded-full">{appliedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-amber-500">Under Review</span>
                  <span className="bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20 px-2 py-0.5 rounded-full">{reviewCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-emerald-500">Selected</span>
                  <span className="bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 px-2 py-0.5 rounded-full">{selectedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-destructive">Rejected</span>
                  <span className="bg-destructive/10 text-destructive font-bold border border-destructive/20 px-2 py-0.5 rounded-full">{rejectedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Details */}
          {post.company && (<Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <Building2 className="h-5 w-5 text-primary"/> Corporate Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block font-semibold">Company Name</span>
                  <span className="font-bold text-foreground text-md">{post.company.name}</span>
                </div>
                {post.company.industry && (<div className="space-y-1">
                    <span className="text-xs text-muted-foreground block font-semibold">Industry</span>
                    <span className="font-semibold text-foreground capitalize">{post.company.industry}</span>
                  </div>)}
                {post.company.location && (<div className="space-y-1">
                    <span className="text-xs text-muted-foreground block font-semibold">Location</span>
                    <span className="font-semibold text-foreground">{post.company.location}</span>
                  </div>)}
                {post.company.contact_email && (<div className="space-y-1 border-t pt-3">
                    <span className="text-xs text-muted-foreground block font-semibold">Contact Email</span>
                    <span className="font-semibold text-primary">{post.company.contact_email}</span>
                  </div>)}
              </CardContent>
            </Card>)}
        </div>
      </div>
    </div>);
}
