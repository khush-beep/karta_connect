import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Briefcase, Bookmark, Loader2 } from "lucide-react";
export const Route = createFileRoute("/_authenticated/student/saved")({
    beforeLoad: requireStudent,
    component: SavedPosts,
});
function SavedPosts() {
    const { user } = useAuth();
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSavedJobs() {
            if (!user)
                return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("saved_posts")
                    .select("post_id, saved_at, job_post:job_posts(title, type, location, deadline, company:companies(name, logo_url))")
                    .eq("student_id", user.id)
                    .order("saved_at", { ascending: false });
                if (error)
                    throw error;
                setSavedJobs(data || []);
            }
            catch (err) {
                console.error("Error loading saved jobs:", err);
                toast.error("Failed to load saved postings.");
            }
            finally {
                setLoading(false);
            }
        }
        loadSavedJobs();
    }, [user]);

    async function handleRemove(postId) {
        if (!user)
            return;
        try {
            const { error } = await supabase
                .from("saved_posts")
                .delete()
                .eq("student_id", user.id)
                .eq("post_id", postId);
            if (error)
                throw error;
            setSavedJobs(savedJobs.filter((row) => row.post_id !== postId));
            toast.success("Removed from saved postings.");
        }
        catch (err) {
            console.error("Error removing saved job:", err);
            toast.error(err.message || "Could not remove saved posting.");
        }
    }

    return (<div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saved Posts</h1>
          <p className="text-muted-foreground mt-1">Review the jobs and internships you bookmarked for later.</p>
        </div>
        <Link to="/student/jobs" search={{}}>
          <Button size="sm" variant="outline">Browse Openings</Button>
        </Link>
      </div>

      {loading ? (<div className="flex h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>) : savedJobs.length === 0 ? (<Card className="border-dashed py-12 text-center">
            <CardHeader>
              <Bookmark className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
              <CardTitle>No saved postings yet</CardTitle>
              <CardDescription>Save jobs or internships from the dashboard or search feed to keep them handy.</CardDescription>
            </CardHeader>
          </Card>) : (<div className="grid gap-4">
            {savedJobs.map((saved) => {
            const job = saved.job_post;
            return (<Card key={saved.post_id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4">
                    <div>
                      <CardTitle className="text-lg font-bold">{job?.title || "Untitled Role"}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">{job?.company?.name || "Partner Company"}</CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="capitalize font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{job?.type}</span>
                        <span>•</span>
                        <span>{job?.location || "Remote"}</span>
                        <span>•</span>
                        <span>Deadline: {job?.deadline}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to="/student/jobs" search={{}}>
                        <Button size="sm" variant="outline">View Listings</Button>
                      </Link>
                      <Button size="sm" variant="secondary" onClick={() => handleRemove(saved.post_id)}>
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                </Card>);
          })}
          </div>)}
    </div>);
}
