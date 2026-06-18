import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Building2, Briefcase, Loader2, GraduationCap, MapPin, Layers, LineChart as LineChartIcon } from "lucide-react";
import { toast } from "sonner";
import { requireAdmin } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/admin/analytics")({
    beforeLoad: requireAdmin,
    component: AdminAnalytics,
});
const PIE_COLORS = [
    "#e2b13c", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899",
    "#f97316", "#14b8a6", "#6366f1", "#d946ef", "#f43f5e",
    "#84cc16", "#06b6d4", "#a855f7", "#ef4444", "#eab308"
];
function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [stats, setStats] = useState({
        students: 0,
        whitelisted: 0,
        companies: 0,
        jobs: 0,
        internships: 0,
        appliedJobs: 0,
        appliedInternships: 0,
        selectedJobs: 0,
        selectedInternships: 0,
    });
    const [pipelineData, setPipelineData] = useState([]);
    const [domainData, setDomainData] = useState([]);
    const [courseData, setCourseData] = useState([]);
    const [regionData, setRegionData] = useState([]);
    const [userGrowthData, setUserGrowthData] = useState([]);
    async function loadData() {
        setLoading(true);
        try {
            const [studentsRes, whitelistRes, companiesRes, jobsRes, appsRes] = await Promise.all([
                supabase.from("student_profiles").select("user_id, created_at, course, location"),
                supabase.from("student_whitelist").select("id"),
                supabase.from("companies").select("id, name, industry, location, created_at"),
                supabase.from("job_posts").select("id, type, company_id, location"),
                supabase.from("applications").select("id, status, applied_at, job_post:job_posts(type)")
            ]);
            if (studentsRes.error)
                throw studentsRes.error;
            if (whitelistRes.error)
                throw whitelistRes.error;
            if (companiesRes.error)
                throw companiesRes.error;
            if (jobsRes.error)
                throw jobsRes.error;
            if (appsRes.error)
                throw appsRes.error;
            const sData = studentsRes.data || [];
            const wData = whitelistRes.data || [];
            const cData = companiesRes.data || [];
            const jData = jobsRes.data || [];
            const aData = appsRes.data || [];
            // Calculate separate metrics for jobs and internships
            const jobsCount = jData.filter(j => j.type === 'job').length;
            const internshipsCount = jData.filter(j => j.type === 'internship').length;
            const appliedJobs = aData.filter(a => a.job_post?.type === 'job').length;
            const appliedInternships = aData.filter(a => a.job_post?.type === 'internship').length;
            const selectedJobs = aData.filter(a => a.status === 'selected' && a.job_post?.type === 'job').length;
            const selectedInternships = aData.filter(a => a.status === 'selected' && a.job_post?.type === 'internship').length;
            setStats({
                students: sData.length,
                whitelisted: wData.length,
                companies: cData.length,
                jobs: jobsCount,
                internships: internshipsCount,
                appliedJobs,
                appliedInternships,
                selectedJobs,
                selectedInternships,
            });
            // Pipeline comparison chart data
            setPipelineData([
                {
                    name: "Applications",
                    Jobs: appliedJobs,
                    Internships: appliedInternships,
                },
                {
                    name: "Selected / Hired",
                    Jobs: selectedJobs,
                    Internships: selectedInternships,
                }
            ]);

            // Analytics by Domain (Industry for companies)
            const dCounts = {};
            cData.forEach(c => { if (c.industry) { dCounts[c.industry] = (dCounts[c.industry] || 0) + 1; } });
            const dArr = Object.keys(dCounts).map(k => ({ name: k, value: dCounts[k] })).sort((a,b)=>b.value-a.value).slice(0, 6);
            setDomainData(dArr);

            // Analytics by Course (For students)
            const courseCounts = {};
            sData.forEach(s => { if (s.course) { courseCounts[s.course] = (courseCounts[s.course] || 0) + 1; } });
            const courseArr = Object.keys(courseCounts).map(k => ({ name: k, value: courseCounts[k] })).sort((a,b)=>b.value-a.value).slice(0, 6);
            setCourseData(courseArr);

            // Analytics by Region (Location)
            const rCounts = {};
            [...cData, ...sData, ...jData].forEach(item => {
                if (item.location) { 
                    const loc = item.location.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    rCounts[loc] = (rCounts[loc] || 0) + 1; 
                }
            });
            const rArr = Object.keys(rCounts).map(k => ({ name: k, value: rCounts[k] })).sort((a,b)=>b.value-a.value).slice(0, 6);
            setRegionData(rArr);

            // Analytics by User (Growth over time by month)
            const userGrowthMap = {};
            const processGrowth = (items, type) => {
                items.forEach(item => {
                    if (item.created_at) {
                        const date = new Date(item.created_at);
                        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (!userGrowthMap[month]) userGrowthMap[month] = { month, students: 0, companies: 0 };
                        userGrowthMap[month][type]++;
                    }
                });
            };
            processGrowth(sData, 'students');
            processGrowth(cData, 'companies');
            const gArr = Object.values(userGrowthMap).sort((a,b) => a.month.localeCompare(b.month));
            setUserGrowthData(gArr);
        }
        catch (err) {
            console.error("Error calculating analytics:", err);
            toast.error("Failed to load dashboard analytics.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        setIsMounted(true);
        loadData();
    }, []);
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary"/> Recruitment & Placement Analytics
        </h1>
        <p className="text-muted-foreground font-medium">Identify application volumes, job placements, and internship engagement.</p>
      </div>

      {/* Main Metrics Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Active Job Posts</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.jobs}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Excludes internship postings</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Active Internship Posts</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.internships}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Excludes job postings</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Registered Scholars</CardTitle>
            <Users className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.students}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.whitelisted} whitelisted overall</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Total Corporate Matches</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{stats.companies}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Partner companies</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Funnels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Placement Stats */}
        <Card className="shadow-sm border-blue-500/10 bg-blue-500/[0.01]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500"/> Job Postings Funnel
            </CardTitle>
            <CardDescription>Applications and selections strictly for full-time jobs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="bg-background border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground block font-medium">Job Applications</span>
              <span className="text-3xl font-extrabold text-blue-600 block mt-1">{stats.appliedJobs}</span>
            </div>
            <div className="bg-background border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground block font-medium">Jobs Selected / Hired</span>
              <span className="text-3xl font-extrabold text-emerald-600 block mt-1">{stats.selectedJobs}</span>
            </div>
          </CardContent>
        </Card>

        {/* Internship Placement Stats */}
        <Card className="shadow-sm border-purple-500/10 bg-purple-500/[0.01]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-500"/> Internship Postings Funnel
            </CardTitle>
            <CardDescription>Applications and selections strictly for student internships.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="bg-background border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground block font-medium">Internship Applications</span>
              <span className="text-3xl font-extrabold text-purple-600 block mt-1">{stats.appliedInternships}</span>
            </div>
            <div className="bg-background border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-muted-foreground block font-medium">Internships Selected / Hired</span>
              <span className="text-3xl font-extrabold text-emerald-600 block mt-1">{stats.selectedInternships}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      {isMounted && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Jobs vs. Internships Pipeline Comparison</CardTitle>
              <CardDescription>Comparative visualization of student application counts and successful selections.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3}/>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}/>
                  <Legend />
                  <Bar dataKey="Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}/>
                  <Bar dataKey="Internships" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Registration Growth */}
          <Card className="shadow-sm md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-indigo-500" /> User Growth Analytics
              </CardTitle>
              <CardDescription>Monthly registrations for scholars and corporate partners.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {userGrowthData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Not enough data to display.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="students" name="Scholars" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="companies" name="Partners" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Region Analytics */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" /> Regional Distribution
              </CardTitle>
              <CardDescription>Top locations based on users and job postings.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {regionData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Not enough location data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {regionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Domain/Industry Analytics */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-pink-500" /> Company Industry Focus
              </CardTitle>
              <CardDescription>Top industries for registered corporate partners.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {domainData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Not enough industry data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domainData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false}/>
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={150} tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}/>
                    <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Scholar Course Analytics */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-cyan-500" /> Scholar Course Distribution
              </CardTitle>
              <CardDescription>Top academic courses pursued by registered scholars.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {courseData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Not enough course data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false}/>
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={150} tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}/>
                    <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>);
}
