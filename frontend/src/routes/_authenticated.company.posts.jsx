import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, MapPin, Briefcase, Trash2, Power, PowerOff, X } from "lucide-react";
import { requireCompany } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/company/posts")({
    beforeLoad: requireCompany,
    validateSearch: (search) => {
        return {
            type: search.type || undefined,
        };
    },
    component: CompanyPostsPage,
});
function CompanyPostsPage() {
  const { user } = useAuth();
  const searchParams = Route.useSearch();
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [applicationStats, setApplicationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [postType, setPostType] = useState("job");
  const [deadline, setDeadline] = useState("");
  const [maxPositions, setMaxPositions] = useState(1);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function loadCompanyData() {
    if (!user) return;
    setLoading(true);
    try {
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (comp) {
        setCompany(comp);
        let query = supabase.from("job_posts").select("*").eq("company_id", comp.id);
        if (searchParams.type) {
          query = query.eq("type", searchParams.type);
        }
        const { data: list } = await query.order("created_at", { ascending: false });
        console.log("POSTS", list);

        setPosts(list || []);
        console.log("APPLICATION STATS", applicationStats);

        if (list?.length) {
          const postIds = list.map((p) => p.id);

          const { data: apps } = await supabase

            .from("applications")

            .select("post_id,status")

            .in("post_id", postIds);

          const stats = {};

          postIds.forEach((id) => {
            stats[id] = {
              total: 0,

              applied: 0,

              review: 0,

              shortlisted: 0,

              selected: 0,

              rejected: 0,
            };
          });

          apps?.forEach((app) => {
            stats[app.post_id].total++;

            stats[app.post_id][app.status]++;
          });

          setApplicationStats(stats);
        }
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadCompanyData();
  }, [user, searchParams.type]);

  async function handleCreatePost(e) {
    e.preventDefault();

    if (!company) return;

    if (!title || !description || !deadline || !location) {
      toast.error("Please fill in all required fields.");

      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase

        .from("job_posts")

        .insert({
          company_id: company.id,

          title,

          description,

          required_skills: skills,

          location,

          type: postType,

          deadline,

          active: true,

          max_positions: maxPositions,

          status: "open",
        });

      if (error) throw error;

      toast.success("Job posting created successfully!");

      setIsCreateOpen(false);

      setTitle("");

      setDescription("");

      setLocation("");

      setDeadline("");

      setSkills([]);

      loadCompanyData();
    } catch (err) {
      toast.error(err.message || "Failed to create posting.");
    } finally {
      setSubmitting(false);
    }
  }
  async function toggleActive(postId, currentStatus) {
    try {
      const { error } = await supabase
        .from("job_posts")
        .update({ active: !currentStatus })
        .eq("id", postId);
      if (error) throw error;
      toast.success(`Post ${!currentStatus ? "activated" : "deactivated"} successfully!`);
      loadCompanyData();
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  }
  async function handleDelete(postId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this listing? This will also archive all candidate applications associated with it.",
    );
    if (!confirmDelete) return;
    try {
      // Delete applications first to avoid foreign key errors
      await supabase.from("applications").delete().eq("post_id", postId);
      const { error } = await supabase.from("job_posts").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Listing deleted successfully!");
      loadCompanyData();
    } catch (err) {
      toast.error(err.message || "Failed to delete post.");
    }
  }
  function addSkill() {
    const trimmed = newSkill.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  }
  function removeSkill(skill) {
    setSkills(skills.filter((s) => s !== skill));
  }
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!company) {
    return (
      <Card className="max-w-xl mx-auto mt-12">
        <CardHeader>
          <CardTitle>Initialize Profile First</CardTitle>
          <CardDescription>
            Setup your company name and settings before publishing jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/company/profile">
            <Button>Complete Profile</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {searchParams.type === "job"
              ? "Manage Jobs"
              : searchParams.type === "internship"
                ? "Manage Internships"
                : "Manage Listings"}
          </h1>
          <p className="text-muted-foreground">
            Publish openings, track status, and coordinate with applicants.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create New Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Career Posting</DialogTitle>
              <DialogDescription>
                Publish a job or internship description to Karta Connect students.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePost} className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="post-title">
                  Role Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="post-title"
                  placeholder="e.g. Software Development Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="post-type">
                    Posting Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="post-type"
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="job">Job (Full-time)</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="post-loc">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="post-loc"
                    placeholder="e.g. Bangalore or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="post-deadline">
                  Application Deadline <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="post-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Number of Openings</Label>

                <Input
                  type="number"
                  min="1"
                  value={maxPositions}
                  onChange={(e) => setMaxPositions(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="post-desc">
                  Role Description & Requirements <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="post-desc"
                  placeholder="Describe key duties, course requirements, and credentials..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Required Skills Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Python, Excel"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish to Portal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Postings Listings */}
      {posts.length === 0 ? (
        <Card className="border-dashed py-12 text-center max-w-xl mx-auto">
          <CardHeader>
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <CardTitle>No postings found</CardTitle>
            <CardDescription>
              Get started by listing your first internship or job role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateOpen(true)}>Create Posting</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {posts.map((post) => {
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            const deadlineDate = new Date(post.deadline);

            deadlineDate.setHours(0, 0, 0, 0);

            const isDeadlinePassed = deadlineDate < today;

            return (
              <Card key={post.id} className={!post.active || isDeadlinePassed ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground">{post.title}</h3>
                        <span
                          className={`text-[10px] border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${post.type === "job" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}
                        >
                          {post.type}
                        </span>
                        {(!post.active || isDeadlinePassed) && (
                          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl">
                        {post.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {post.location || "Remote"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Deadline: {post.deadline}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">
                        <span className="text-muted-foreground">
                          👥 Applicants:
                          {applicationStats[post.id]?.total || 0}
                        </span>

                        <span className="text-blue-500">
                          Applied:
                          {applicationStats[post.id]?.applied || 0}
                        </span>

                        <span className="text-amber-500">
                          Review:
                          {applicationStats[post.id]?.review || 0}
                        </span>

                        <span className="text-purple-500">
                          Shortlisted:
                          {applicationStats[post.id]?.shortlisted || 0}
                        </span>

                        <span className="text-green-500">
                          Selected:
                          {applicationStats[post.id]?.selected || 0}
                        </span>

                        <span className="text-red-500">
                          Rejected:
                          {applicationStats[post.id]?.rejected || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
                      <Button
                        onClick={() => toggleActive(post.id, post.active)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        {post.active ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5 text-amber-500" /> Close Post
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 text-emerald-500" /> Reopen Post
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDelete(post.id)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>

                  {post.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t">
                      {post.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold capitalize text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
