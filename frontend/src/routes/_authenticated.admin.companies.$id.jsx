import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, ArrowLeft, Globe, Mail, Phone, MapPin, Briefcase, Users, FileText, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/admin/companies/$id")({
    beforeLoad: requireAdmin,
    component: AdminCompanyDetails,
});
function AdminCompanyDetails() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    async function loadData() {
        setLoading(true);
        try {
            // 1. Fetch company profile
            const compRes = await supabase.from("companies").select("*").eq("id", id).single();
            if (compRes.error)
                throw compRes.error;
            setCompany(compRes.data);
            // 2. Fetch company jobs
            const jobsRes = await supabase.from("job_posts").select("*").eq("company_id", id).order("created_at", { ascending: false });
            if (jobsRes.error)
                throw jobsRes.error;
            const jobList = jobsRes.data || [];
            setJobs(jobList);
            if (jobList.length > 0) {
                const jobIds = jobList.map((j) => j.id);
                // 3. Fetch applications for those jobs
                const [appsRes, profilesRes] = await Promise.all([
                    supabase.from("applications").select("*, job_posts(title)").in("post_id", jobIds),
                    supabase.from("student_profiles").select("user_id, name, email, university, resume_url")
                ]);
                if (appsRes.error)
                    throw appsRes.error;
                if (profilesRes.error)
                    throw profilesRes.error;
                // Map student profiles to applications
                const profileMap = new Map();
                profilesRes.data?.forEach((p) => {
                    profileMap.set(p.user_id, p);
                });
                const mappedApps = (appsRes.data || []).map((app) => {
                    const student = profileMap.get(app.student_id);
                    return {
                        ...app,
                        studentName: student?.name || "Karta Scholar",
                        studentEmail: student?.email || "N/A",
                        studentUniversity: student?.university || "N/A",
                        resumeUrl: student?.resume_url || null
                    };
                });
                setApplications(mappedApps);
            }
            else {
                setApplications([]);
            }
        }
        catch (err) {
            console.error("Error loading admin company details:", err);
            toast.error(err.message || "Failed to load corporate partner details.");
            navigate({ to: "/admin/companies" });
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, [id]);
    async function toggleJobActive(jobId, currentActive) {
        try {
            const { error } = await supabase
                .from("job_posts")
                .update({ active: !currentActive })
                .eq("id", jobId);
            if (error)
                throw error;
            toast.success(`Job post visibility successfully updated!`);
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to toggle job post visibility.");
        }
    }
    async function deleteJob(jobId) {
        const confirmDelete = window.confirm("Are you sure you want to delete this career listing? This will also remove all candidate applications for this role.");
        if (!confirmDelete)
            return;
        try {
            // Cascade delete is handled by database FOREIGN KEY constraints (ON DELETE CASCADE)
            const { error } = await supabase.from("job_posts").delete().eq("id", jobId);
            if (error)
                throw error;
            toast.success("Job posting deleted.");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to delete job post.");
        }
    }
    async function changeAppStatus(appId, newStatus) {
        try {
            const { error } = await supabase
                .from("applications")
                .update({ status: newStatus })
                .eq("id", appId);
            if (error)
                throw error;
            toast.success(`Candidate status updated to ${newStatus}`);
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to update application status.");
        }
    }
    async function deleteApplication(appId) {
        const confirmDelete = window.confirm("Are you sure you want to withdraw this student's application?");
        if (!confirmDelete)
            return;
        try {
            const { error } = await supabase.from("applications").delete().eq("id", appId);
            if (error)
                throw error;
            toast.success("Application withdrawn.");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to delete application.");
        }
    }
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!company)
        return null;
    // Pipeline metrics
    const totalJobsings = jobs.length;
    const activePostingsCount = jobs.filter((j) => j.active).length;
    const totalSubmissions = applications.length;
    const appStatusCounts = {
        applied: applications.filter((a) => a.status === "applied").length,
        review: applications.filter((a) => a.status === "review").length,
        selected: applications.filter((a) => a.status === "selected").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
    };
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <Link to="/admin/companies" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4"/> Back to Partners
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-2xl p-4 text-primary">
              <Building2 className="h-10 w-10"/>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{company.name}</h1>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                {company.industry && <span>{company.industry}</span>}
                {company.industry && company.location && <span>•</span>}
                {company.location && <span className="flex items-center gap-0.5"><MapPin className="h-3.5 w-3.5"/> {company.location}</span>}
              </p>
            </div>
          </div>
          {company.website && (<Button asChild variant="outline">
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Globe className="h-4 w-4"/> Visit Website
              </a>
            </Button>)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info Card */}
        <Card className="shadow-sm md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Contact Details</CardTitle>
            <CardDescription>Primary corporate touchpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5"/>
              <div>
                <div className="font-semibold text-foreground">Contact Email</div>
                <a href={`mailto:${company.contact_email}`} className="text-primary hover:underline">{company.contact_email}</a>
              </div>
            </div>
            {company.contact_phone && (<div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5"/>
                <div>
                  <div className="font-semibold text-foreground">Phone Number</div>
                  <div className="text-muted-foreground">{company.contact_phone}</div>
                </div>
              </div>)}
            {company.description && (<div className="border-t pt-4 mt-2">
                <div className="font-semibold text-foreground mb-1">About Company</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{company.description}</p>
              </div>)}
          </CardContent>
        </Card>

        {/* Hiring Stats Grid */}
        <div className="md:col-span-2 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground">Active Roles</CardTitle>
              <Briefcase className="h-4 w-4 text-primary"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold">{activePostingsCount}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">out of {totalJobsings} total</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground">Applications</CardTitle>
              <Users className="h-4 w-4 text-primary"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold">{totalSubmissions}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Received to date</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground">Selected</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-emerald-500">{appStatusCounts.selected}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Scholars hired</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="p-4 flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground">Reviewing</CardTitle>
              <FileText className="h-4 w-4 text-amber-500"/>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-extrabold text-amber-500">{appStatusCounts.review}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">In matching pipeline</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Company Job Listings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Active Career Postings</CardTitle>
          <CardDescription>All job and internship listings published by this partner.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (<div className="text-center py-8 text-sm text-muted-foreground">No listings have been posted by this company yet.</div>) : (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (<TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <Link to="/admin/posts/$id" params={{ id: job.id }} className="hover:underline text-primary">
                        {job.title}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize font-medium">{job.type}</TableCell>
                    <TableCell>{job.location || "N/A"}</TableCell>
                    <TableCell>{job.deadline}</TableCell>
                    <TableCell>
                      {job.active ? (<span className="text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>) : (<span className="text-xs border bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                          Inactive
                        </span>)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button onClick={() => toggleJobActive(job.id, job.active)} variant="outline" size="sm" className="h-8">
                        {job.active ? "Pause" : "Activate"}
                      </Button>
                      <Button onClick={() => deleteJob(job.id)} variant="destructive" size="sm" className="h-8">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </Button>
                    </TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>)}
        </CardContent>
      </Card>

      {/* Company Candidate Applications */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Scholars who applied to this company's postings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (<div className="text-center py-8 text-sm text-muted-foreground">No candidate applications have been submitted yet.</div>) : (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Applied Role</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                const statusStyles = {
                    applied: "bg-blue-500/10 text-blue-500 border-blue-500/20",
                    review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    selected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    rejected: "bg-destructive/10 text-destructive border-destructive/20"
                };
                return (<TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          <Link to="/admin/students/$id" params={{ id: app.student_id }} className="hover:underline text-primary">
                            {app.studentName}
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{app.studentEmail}</div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{app.studentUniversity}</TableCell>
                      <TableCell className="font-semibold text-foreground">{app.job_posts?.title || "N/A"}</TableCell>
                      <TableCell className="text-sm">{new Date(app.applied_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`text-xs border px-2.5 py-0.5 rounded-full capitalize font-semibold ${statusStyles[app.status]}`}>
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {app.resumeUrl && (<Button asChild variant="outline" size="sm" className="h-8">
                            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              Resume
                            </a>
                          </Button>)}
                        <select value={app.status} onChange={(e) => changeAppStatus(app.id, e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium">
                          <option value="applied">Applied</option>
                          <option value="review">Review</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <Button onClick={() => deleteApplication(app.id)} variant="destructive" size="sm" className="h-8">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </Button>
                      </TableCell>
                    </TableRow>);
            })}
              </TableBody>
            </Table>)}
        </CardContent>
      </Card>
    </div>);
}
