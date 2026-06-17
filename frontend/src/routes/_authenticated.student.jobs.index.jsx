import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Briefcase, Search, MapPin, Calendar, ChevronRight, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { requireStudent } from "@/lib/route-guards";
export const Route = createFileRoute("/_authenticated/student/jobs/")({
    beforeLoad: requireStudent,
    validateSearch: (search) => {
        return {
            type: search.type || undefined,
        };
    },
    component: StudentJobsPage,
});
function StudentJobsPage() {
    const searchParams = Route.useSearch();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    // Load jobs matching the search filters
    async function loadJobs() {
        setLoading(true);
        try {
            let query = supabase
                .from("job_posts")
                .select("*, company:companies(name, logo_url, description)")
                .eq("active", true);
            if (searchParams.type) {
                query = query.eq("type", searchParams.type);
            }
            const { data, error } = await query.order("created_at", { ascending: false });
            if (error)
                throw error;
            setJobs(data || []);
        }
        catch (err) {
            console.error("Error loading job posts:", err);
            toast.error("Failed to load listings.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadJobs();
    }, [searchParams.type]);
    const filteredJobs = jobs.filter((job) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query)
            return true;
        return (job.title.toLowerCase().includes(query) ||
            job.description.toLowerCase().includes(query) ||
            job.company?.name.toLowerCase().includes(query) ||
            job.required_skills?.some((s) => s.toLowerCase().includes(query)));
    });
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {searchParams.type === "job" ? "Job Openings" : searchParams.type === "internship" ? "Internship Openings" : "All Openings"}
          </h1>
          <p className="text-muted-foreground">Find and apply to verified career opportunities.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input placeholder="Search by role, company, or skills..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
        <Button onClick={loadJobs} variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4"/> Refresh
        </Button>
      </div>

      {/* Jobs Grid */}
      {loading ? (<div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>) : filteredJobs.length === 0 ? (<div className="text-center py-12 border border-dashed rounded-xl bg-card">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-3"/>
          <h3 className="font-semibold text-foreground">No openings found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try modifying your search queries or check back later.</p>
        </div>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (<Card key={job.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="h-10 w-10 border rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {job.company?.logo_url ? (<img src={job.company.logo_url} alt={job.company.name} className="h-full w-full object-cover"/>) : (<Briefcase className="h-5 w-5 text-muted-foreground"/>)}
                  </div>
                  <span className={`text-[10px] border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${job.type === "job" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"}`}>
                    {job.type}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold mt-3 line-clamp-1">{job.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-1">{job.company?.name || "Company partner"}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{job.description}</p>
                <div className="flex flex-wrap gap-1">
                  {job.required_skills?.slice(0, 3).map((skill) => (<span key={skill} className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium capitalize">
                      {skill}
                    </span>))}
                  {job.required_skills?.length > 3 && (<span className="text-[10px] text-muted-foreground px-1 py-0.5">
                      +{job.required_skills.length - 3} more
                    </span>)}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-auto flex items-center justify-between py-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3"/>
                  <span className="line-clamp-1 max-w-[120px]">{job.location || "Remote"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3"/>
                  <span>Due: {job.deadline}</span>
                </div>
              </CardFooter>
            </Card>))}
        </div>)}

      {/* Slide-over Job Details Sheet */}
      <Sheet open={selectedJob !== null} onOpenChange={(open) => { if (!open)
        setSelectedJob(null); }}>
        {selectedJob && (<SheetContent className="sm:max-w-xl overflow-y-auto">
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 border rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {selectedJob.company?.logo_url ? (<img src={selectedJob.company.logo_url} alt={selectedJob.company.name} className="h-full w-full object-cover"/>) : (<Briefcase className="h-6 w-6 text-muted-foreground"/>)}
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold">{selectedJob.title}</SheetTitle>
                  <SheetDescription className="text-sm font-semibold">{selectedJob.company?.name}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Job Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Location</span>
                  <span className="font-semibold flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary"/> {selectedJob.location || "Remote"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">Application Deadline</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary"/> {selectedJob.deadline}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">Role Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.required_skills?.map((skill) => (<span key={skill} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold capitalize">
                      {skill}
                    </span>))}
                </div>
              </div>

              {/* Company Info */}
              {selectedJob.company?.description && (<div className="space-y-2 border-t pt-4">
                  <h4 className="font-bold text-foreground">About the Company</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedJob.company.description}
                  </p>
                </div>)}
            </div>

            <div className="border-t pt-4 mt-auto">
              <Link to="/student/jobs/$id/apply" params={{ id: selectedJob.id }}>
                <Button className="w-full flex items-center justify-center gap-2" size="lg">
                  Apply Now <ChevronRight className="h-4 w-4"/>
                </Button>
              </Link>
            </div>
          </SheetContent>)}
      </Sheet>
    </div>);
}
