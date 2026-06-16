import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Building2, Briefcase, FileText, Plus, Loader2, Sparkles, TrendingUp, UserCheck, Globe } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
export const Route = createFileRoute("/_authenticated/dashboard")({
    component: DashboardDispatcher,
});
function DashboardDispatcher() {
    const { role, user } = useAuth();
    if (role === "admin")
        return <AdminDashboard />;
    if (role === "company")
        return <CompanyDashboard userId={user?.id}/>;
    return <StudentDashboard userId={user?.id}/>;
}
// ----------------------------------------------------
// 1. ADMIN DASHBOARD
// ----------------------------------------------------
function AdminDashboard() {
    const [stats, setStats] = useState({
        whitelistCount: 0,
        registeredStudents: 0,
        companies: 0,
        jobs: 0,
        internships: 0,
        applications: 0
    });
    const [loading, setLoading] = useState(true);
    const [whitelistEmail, setWhitelistEmail] = useState("");
    const [whitelistName, setWhitelistName] = useState("");
    const [whitelistUni, setWhitelistUni] = useState("");
    const [whitelistCourse, setWhitelistCourse] = useState("");
    const [submittingWhitelist, setSubmittingWhitelist] = useState(false);
    // Mock charts data
    const registrationsData = [
        { name: "Jan", Students: 2, Companies: 1 },
        { name: "Feb", Students: 5, Companies: 2 },
        { name: "Mar", Students: 8, Companies: 3 },
        { name: "Apr", Students: 15, Companies: 5 },
        { name: "May", Students: 25, Companies: 8 },
        { name: "Jun", Students: 35, Companies: 12 },
    ];
    async function fetchStats() {
        setLoading(true);
        try {
            const [wl, sp, cp, jp, app] = await Promise.all([
                supabase.from("student_whitelist").select("id", { count: "exact", head: true }),
                supabase.from("student_profiles").select("user_id", { count: "exact", head: true }),
                supabase.from("companies").select("id", { count: "exact", head: true }),
                supabase.from("job_posts").select("id, type"),
                supabase.from("applications").select("id", { count: "exact", head: true })
            ]);
            const jobsCount = jp.data?.filter(p => p.type === "job").length || 0;
            const internshipsCount = jp.data?.filter(p => p.type === "internship").length || 0;
            setStats({
                whitelistCount: wl.count || 0,
                registeredStudents: sp.count || 0,
                companies: cp.count || 0,
                jobs: jobsCount,
                internships: internshipsCount,
                applications: app.count || 0
            });
        }
        catch (err) {
            console.error("Error fetching admin stats:", err);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchStats();
    }, []);
    async function handleWhitelistSubmit(e) {
        e.preventDefault();
        if (!whitelistEmail)
            return;
        setSubmittingWhitelist(true);
        try {
            const { error } = await supabase.from("student_whitelist").insert({
                email: whitelistEmail.trim().toLowerCase(),
                name: whitelistName.trim(),
                university: whitelistUni.trim(),
                course: whitelistCourse.trim(),
                year_of_study: "1st Year",
                graduation_year: String(new Date().getFullYear() + 4),
                used: false
            });
            if (error)
                throw error;
            toast.success("Student whitelisted successfully!");
            setWhitelistEmail("");
            setWhitelistName("");
            setWhitelistUni("");
            setWhitelistCourse("");
            fetchStats();
        }
        catch (err) {
            toast.error(err.message || "Failed to whitelist student.");
        }
        finally {
            setSubmittingWhitelist(false);
        }
    }
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage whitelists, review portal metrics, and system activity.</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">Refresh Stats</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Whitelisted / Active Students</CardTitle>
            <Users className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.whitelistCount} / {stats.registeredStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Total whitelist slots allocated vs registered users.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Companies</CardTitle>
            <Building2 className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
            <p className="text-xs text-muted-foreground mt-1">Corporate partners hiring Karta talent.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Placements & Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobs + stats.internships}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.jobs} Jobs, {stats.internships} Internships listed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Whitelist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary"/> Whitelist Student
            </CardTitle>
            <CardDescription>Authorize a student email so they can create an account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWhitelistSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="wl-email">Student Email</Label>
                <Input id="wl-email" type="email" placeholder="student@example.com" value={whitelistEmail} onChange={(e) => setWhitelistEmail(e.target.value)} required/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wl-name">Full Name</Label>
                <Input id="wl-name" placeholder="John Doe" value={whitelistName} onChange={(e) => setWhitelistName(e.target.value)} required/>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="wl-uni">University</Label>
                  <Input id="wl-uni" placeholder="Vidyashilp" value={whitelistUni} onChange={(e) => setWhitelistUni(e.target.value)} required/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wl-course">Course</Label>
                  <Input id="wl-course" placeholder="B-Tech CSE" value={whitelistCourse} onChange={(e) => setWhitelistCourse(e.target.value)} required/>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submittingWhitelist}>
                {submittingWhitelist ? "Adding..." : "Add to Whitelist"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary"/> Registration Growth
            </CardTitle>
            <CardDescription>Cumulative registered users over current calendar period.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={registrationsData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip />
                <Area type="monotone" dataKey="Students" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorStudents)"/>
                <Area type="monotone" dataKey="Companies" stroke="#a8a29e" fill="none"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>);
}
// ----------------------------------------------------
// 2. COMPANY DASHBOARD
// ----------------------------------------------------
function CompanyDashboard({ userId }) {
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadCompanyData() {
            if (!userId)
                return;
            try {
                const { data: comp } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("owner_user_id", userId)
                    .maybeSingle();
                if (comp) {
                    setCompany(comp);
                    const { data: list } = await supabase
                        .from("job_posts")
                        .select("*, applications(count)")
                        .eq("company_id", comp.id);
                    setJobs(list || []);
                }
            }
            catch (err) {
                console.error("Error loading company dashboard:", err);
            }
            finally {
                setLoading(false);
            }
        }
        loadCompanyData();
    }, [userId]);
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!company) {
        return (<Card className="max-w-xl mx-auto mt-12">
        <CardHeader>
          <CardTitle>Welcome to Karta Connect</CardTitle>
          <CardDescription>It looks like your company profile is not initialized yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Please navigate to the profile section to establish your company details and logo.
          </p>
          <Link to="/company/profile"><Button>Set Up Company Profile</Button></Link>
        </CardContent>
      </Card>);
    }
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {company.name}!</h1>
          <p className="text-muted-foreground">Manage your job and internship openings and candidates.</p>
        </div>
        <Link to="/company/posts" search={{ type: "job" }}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4"/> Create New Posting
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Jobs and internships published on the network.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applicants</CardTitle>
            <FileText className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobs.reduce((acc, job) => acc + (job.applications?.[0]?.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Applications received for your openings.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Job & Internship Openings</CardTitle>
          <CardDescription>A summary of your published openings and application counts.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (<div className="text-center py-8 text-sm text-muted-foreground">
              No active listings found. Click "Create New Posting" to begin.
            </div>) : (<div className="space-y-4">
              {jobs.map((job) => (<div key={job.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <h4 className="font-semibold text-foreground">{job.title}</h4>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span className="capitalize">{job.type}</span>
                      <span>•</span>
                      <span>Deadline: {job.deadline}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm bg-muted px-3 py-1 rounded-full font-medium">
                      {job.applications?.[0]?.count || 0} applicants
                    </span>
                    <Link to="/company/applications">
                      <Button variant="ghost" size="sm">View Applicants</Button>
                    </Link>
                  </div>
                </div>))}
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
// ----------------------------------------------------
// 3. STUDENT DASHBOARD
// ----------------------------------------------------
function StudentDashboard({ userId }) {
    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadStudentData() {
            if (!userId)
                return;
            try {
                const { data: prof } = await supabase
                    .from("student_profiles")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();
                setProfile(prof);
                // Fetch recent active jobs
                const { data: list } = await supabase
                    .from("job_posts")
                    .select("*, company:companies(name, logo_url)")
                    .eq("active", true)
                    .order("created_at", { ascending: false })
                    .limit(3);
                setJobs(list || []);
                // Fetch student applications for counts
                const { data: apps } = await supabase
                    .from("applications")
                    .select("*, job_post:job_posts(title, company:companies(name))")
                    .eq("student_id", userId)
                    .order("applied_at", { ascending: false });
                setApplications(apps || []);
                // Fetch unblocked partner companies
                const { data: comps } = await supabase
                    .from("companies")
                    .select("*")
                    .eq("blocked", false)
                    .order("name", { ascending: true })
                    .limit(6);
                setCompanies(comps || []);
            }
            catch (err) {
                console.error("Error loading student dashboard:", err);
            }
            finally {
                setLoading(false);
            }
        }
        loadStudentData();
    }, [userId]);
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    // Profile check
    const isProfileIncomplete = !profile?.name || !profile?.university || !profile?.course;
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Welcome back, {profile?.name || "Student"}!
        </h1>
        <p className="text-muted-foreground font-medium">Find verified jobs and track your submissions.</p>
      </div>

      {isProfileIncomplete && (<Card className="border-warning bg-warning/5 text-warning-foreground">
          <CardHeader className="pb-2 flex flex-row items-center gap-3">
            <Sparkles className="h-5 w-5 text-warning"/>
            <CardTitle className="text-md font-bold">Profile Incomplete</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Please fill in all required academic details in your profile to enable job applications.
            <div className="mt-3">
              <Link to="/student/profile"><Button size="sm" variant="outline">Complete Profile</Button></Link>
            </div>
          </CardContent>
        </Card>)}

      {/* Metrics Grid (Clickable links to matching sections) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/student/applications" className="block transition-all hover:scale-[1.01]">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">My Applications</CardTitle>
              <FileText className="h-4 w-4 text-primary"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Track and monitor your submission status.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/student/jobs" search={{}} className="block transition-all hover:scale-[1.01]">
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground">Verified Jobs Available</CardTitle>
              <Briefcase className="h-4 w-4 text-primary"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Browse matched roles posted by verified partners.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid Content (LinkedIn Style Sidebar + Main Openings Feed) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommended Openings (Left side - 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Recommended Openings</CardTitle>
                <CardDescription className="font-medium">Latest matched job and internship positions.</CardDescription>
              </div>
              <Link to="/student/jobs" search={{}}>
                <Button variant="outline" size="sm" className="font-semibold">See All Listings</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {jobs.length === 0 ? (<div className="text-center py-8 text-sm text-muted-foreground">No active postings available right now.</div>) : (jobs.map((job) => (<div key={job.id} className="flex flex-col sm:flex-row justify-between border-b pb-4 last:border-0 last:pb-0 gap-3">
                    <div>
                      <h4 className="font-bold text-foreground hover:underline">
                        <Link to="/student/jobs" search={{}}>{job.title}</Link>
                      </h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">{job.company?.name || "Karta Partner"}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-2 items-center">
                        <span className="capitalize font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{job.type}</span>
                        <span>•</span>
                        <span>Deadline: {job.deadline}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Link to="/student/jobs" search={{}}>
                        <Button size="sm" className="font-semibold">View Details</Button>
                      </Link>
                    </div>
                  </div>)))}
            </CardContent>
          </Card>
        </div>

        {/* Hiring Partners Network (Right side - 1 col - LinkedIn style) */}
        <div className="lg:col-span-1">
          <Card className="h-full shadow-sm border border-border/80">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary"/> Hiring Partners
              </CardTitle>
              <CardDescription className="font-medium">Organizations partner with Karta Network.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {companies.length === 0 ? (<div className="text-center py-8 text-sm text-muted-foreground">No partner companies active at this time.</div>) : (companies.map((c) => {
            // Fallback initials generator
            const initials = c.name
                ? c.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "CO";
            return (<div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 border rounded-lg bg-primary/5 border-primary/15 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-primary text-xs">
                          {c.logo_url ? (<img src={c.logo_url} alt={c.name} className="h-full w-full object-cover"/>) : (<span>{initials}</span>)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-foreground text-xs truncate" title={c.name}>{c.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-medium truncate">
                            {c.industry || "Industry Partner"}
                          </p>
                          {c.location && (<p className="text-[9px] text-muted-foreground/80 font-medium truncate">
                              {c.location}
                            </p>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.website && (<a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Visit Website">
                            <Globe className="h-3.5 w-3.5"/>
                          </a>)}
                      </div>
                    </div>);
        }))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
