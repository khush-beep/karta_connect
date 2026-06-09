import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Briefcase, GraduationCap, Search, Trash2, Loader2, Sparkles, MapPin, Calendar, Power, PowerOff, FileText, ChevronRight
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/posts/")({
  component: AdminPostsPage,
});

function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "job" | "internship">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [stats, setStats] = useState({
    totalPosts: 0,
    activeJobs: 0,
    activeInternships: 0,
    totalApplications: 0,
  });

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch posts, joined company details, and candidate applications count
      const { data: postsRes, error: postsErr } = await supabase
        .from("job_posts")
        .select("*, company:companies(name, logo_url, contact_email), applications(id)")
        .order("created_at", { ascending: false });

      if (postsErr) throw postsErr;

      const list = postsRes || [];
      setPosts(list);

      // Compute statistics
      const totalApps = list.reduce((acc, p) => acc + (p.applications?.length || 0), 0);
      setStats({
        totalPosts: list.length,
        activeJobs: list.filter(p => p.type === "job" && p.active).length,
        activeInternships: list.filter(p => p.type === "internship" && p.active).length,
        totalApplications: totalApps,
      });
    } catch (err: any) {
      console.error("Error loading admin posts:", err);
      toast.error(err.message || "Failed to load listings directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleActive(postId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("job_posts")
        .update({ active: !currentStatus })
        .eq("id", postId);

      if (error) throw error;
      toast.success(`Listing successfully ${!currentStatus ? "activated" : "deactivated"}!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing state.");
    }
  }

  async function handleDelete(postId: string) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this listing? This will also remove all candidate applications associated with it."
    );
    if (!confirmDelete) return;

    try {
      // Remove applicant relations first to preserve DB constraint triggers
      await supabase.from("applications").delete().eq("post_id", postId);
      const { error } = await supabase.from("job_posts").delete().eq("id", postId);

      if (error) throw error;
      toast.success("Listing deleted successfully!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete listing.");
    }
  }

  // Filter listings based on queries
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase().trim();
    const companyName = post.company?.name || "";
    const matchesSearch =
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      companyName.toLowerCase().includes(query) ||
      (post.location || "").toLowerCase().includes(query);

    const matchesType = typeFilter === "all" || post.type === typeFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? post.active : !post.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" /> Global Job Postings
        </h1>
        <p className="text-muted-foreground font-medium">
          Monitor all published jobs and internships, check applicant volumes, and toggle listing availability.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground mt-1">Jobs & internships published overall.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Full-time opportunities currently open.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Internships</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInternships}</div>
            <p className="text-xs text-muted-foreground mt-1">Internship listings currently open.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">Total student applications processed.</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search postings by role, company, skills, location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-xs text-muted-foreground font-medium">Type:</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              <option value="all">All Types</option>
              <option value="job">Jobs</option>
              <option value="internship">Internships</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs text-muted-foreground font-medium">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <Button onClick={loadData} variant="outline" size="sm" className="h-9">
            Refresh
          </Button>
        </div>
      </div>

      {/* Postings Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground font-medium">
              No matching listings found in the directory.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role / Organization</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => {
                  return (
                    <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div>
                          <Link
                            to="/admin/posts/$id"
                            params={{ id: post.id }}
                            className="font-bold text-foreground hover:underline text-primary flex items-center gap-1"
                          >
                            {post.title} <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </Link>
                          <div className="text-xs text-muted-foreground font-medium mt-0.5">
                            {post.company?.name || "Unknown Company"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {post.location || "Remote"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${post.type === "job" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}>
                          {post.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link
                          to="/admin/posts/$id"
                          params={{ id: post.id }}
                          className="hover:underline"
                        >
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors">
                            {post.applications?.length || 0} applied
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {post.deadline}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] border px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${post.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                          {post.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          onClick={() => toggleActive(post.id, post.active)}
                          variant="outline"
                          size="sm"
                          className="h-8"
                          title={post.active ? "Deactivate listing" : "Activate listing"}
                        >
                          {post.active ? (
                            <PowerOff className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <Power className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(post.id)}
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          title="Delete listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
