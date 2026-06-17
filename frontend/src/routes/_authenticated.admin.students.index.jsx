import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Search, ShieldAlert, ShieldCheck, Trash2, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/route-guards";
import { authenticatedFetch } from "@/lib/api-client";
export const Route = createFileRoute("/_authenticated/admin/students/")({
    beforeLoad: requireAdmin,
    component: AdminStudentsPage,
});
async function deleteStudentAccount(userId, email) {
    return authenticatedFetch("http://localhost:3001/api/admin/delete-student", {
        method: "POST",
        body: JSON.stringify({ userId, email })
    });
}
function AdminStudentsPage() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [whitelist, setWhitelist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
    async function handleRemoveRegistered(profileId, email) {
        const confirmDelete = window.confirm("Are you sure you want to permanently delete this student, their profile, applications, and account?");
        if (!confirmDelete)
            return;
        try {
            const res = await deleteStudentAccount(profileId, email);
            if (res.success) {
                toast.success("Student account and all data deleted successfully!");
                loadData();
            }
            else {
                toast.error(res.error || "Failed to delete student account.");
            }
        }
        catch (err) {
            toast.error(err.message || "Failed to delete student.");
        }
    }
    // Whitelist form
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [place, setPlace] = useState("");
    const [university, setUniversity] = useState("");
    const [course, setCourse] = useState("");
    const [submitting, setSubmitting] = useState(false);
    async function loadData() {
        setLoading(true);
        try {
            const [profilesRes, whitelistRes] = await Promise.all([
                supabase.from("student_profiles").select("*"),
                supabase.from("student_whitelist").select("*")
            ]);
            if (profilesRes.error)
                throw profilesRes.error;
            if (whitelistRes.error)
                throw whitelistRes.error;
            setStudents(profilesRes.data || []);
            setWhitelist(whitelistRes.data || []);
        }
        catch (err) {
            console.error("Error loading admin students:", err);
            toast.error("Failed to load students directory.");
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadData();
    }, []);
    // Merge registered students and whitelisted students to get unified status logic
    const allEntries = (() => {
        const entriesMap = new Map();
        // 1. Add all whitelists first as 'inactive'
        whitelist.forEach((wl) => {
            entriesMap.set(wl.email.toLowerCase(), {
                email: wl.email,
                name: wl.name || "Karta Scholar",
                university: wl.university || "",
                course: wl.course || "",
                place: wl.place || "",
                status: "inactive",
                registered: false,
                whitelistId: wl.id,
                profileId: null,
                blocked: false,
                graduationYear: wl.graduation_year || "N/A"
            });
        });
        // 2. Add/merge registered profiles as 'active' or 'blocked'
        students.forEach((stud) => {
            const emailLower = stud.email.toLowerCase();
            entriesMap.set(emailLower, {
                email: stud.email,
                name: stud.name || "Karta Scholar",
                university: stud.university || "",
                course: stud.course || "",
                place: stud.location || "",
                status: stud.blocked ? "blocked" : "active",
                registered: true,
                whitelistId: entriesMap.get(emailLower)?.whitelistId || null,
                profileId: stud.user_id,
                blocked: stud.blocked,
                graduationYear: stud.graduation_year || "N/A"
            });
        });
        return Array.from(entriesMap.values());
    })();
    const filteredEntries = allEntries.filter((ent) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || (ent.name.toLowerCase().includes(query) ||
            ent.email.toLowerCase().includes(query) ||
            ent.university.toLowerCase().includes(query) ||
            ent.course.toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" || ent.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    async function handleWhitelistSubmit(e) {
        e.preventDefault();
        if (!email)
            return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from("student_whitelist").insert({
                email: email.trim().toLowerCase(),
                name: name.trim(),
                place: place.trim(),
                university: university.trim(),
                course: course.trim(),
                year_of_study: "1st Year",
                graduation_year: String(new Date().getFullYear() + 4),
                used: false
            });
            if (error)
                throw error;
            toast.success("Student email successfully whitelisted!");
            setIsWhitelistOpen(false);
            // Reset form
            setEmail("");
            setName("");
            setPlace("");
            setUniversity("");
            setCourse("");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to whitelist email.");
        }
        finally {
            setSubmitting(false);
        }
    }
    async function toggleBlock(profileId, currentBlocked) {
        try {
            const { error } = await supabase
                .from("student_profiles")
                .update({ blocked: !currentBlocked })
                .eq("user_id", profileId);
            if (error)
                throw error;
            toast.success(`Student successfully ${!currentBlocked ? "blocked" : "unblocked"}!`);
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to alter status.");
        }
    }
    async function handleDeleteWhitelist(whitelistId) {
        const confirmDelete = window.confirm("Are you sure you want to remove this whitelisted student?");
        if (!confirmDelete)
            return;
        try {
            const { error } = await supabase.from("student_whitelist").delete().eq("id", whitelistId);
            if (error)
                throw error;
            toast.success("Student whitelist entry removed.");
            loadData();
        }
        catch (err) {
            toast.error(err.message || "Failed to delete whitelist.");
        }
    }
    if (loading) {
        return (<div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary"/> Student Directory
          </h1>
          <p className="text-muted-foreground font-medium">Verify whitelists, adjust security blocks, and query student profiles.</p>
        </div>

        <Dialog open={isWhitelistOpen} onOpenChange={setIsWhitelistOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4"/> Whitelist Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Whitelist</DialogTitle>
              <DialogDescription>Authorize a student email to log in and register.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleWhitelistSubmit} className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="email-input">Student Email <span className="text-destructive">*</span></Label>
                <Input id="email-input" type="email" placeholder="student@karta.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name-input">Full Name <span className="text-destructive">*</span></Label>
                <Input id="name-input" placeholder="e.g. Mehek" value={name} onChange={(e) => setName(e.target.value)} required/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="place-input">Location / Place</Label>
                <Input id="place-input" placeholder="e.g. Shimla" value={place} onChange={(e) => setPlace(e.target.value)}/>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="uni-input">University</Label>
                  <Input id="uni-input" placeholder="Vidyashilp" value={university} onChange={(e) => setUniversity(e.target.value)}/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="course-input">Course</Label>
                  <Input id="course-input" placeholder="B-tech CSE" value={course} onChange={(e) => setCourse(e.target.value)}/>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Whitelisting..." : "Add Student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input placeholder="Search students by name, email, university..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-xs text-muted-foreground shrink-0">Filter Status:</Label>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium">
            <option value="all">All Statuses</option>
            <option value="active">Active (Registered)</option>
            <option value="inactive">Inactive (Whitelist only)</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <Card>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (<div className="text-center py-12 text-sm text-muted-foreground">No students match the criteria.</div>) : (<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>University / Course</TableHead>
                  <TableHead>Graduation Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((ent) => {
                const statusStyles = {
                    active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    inactive: "bg-muted text-muted-foreground",
                    blocked: "bg-destructive/10 text-destructive border-destructive/20"
                };
                return (<TableRow key={ent.email} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">
                        {ent.registered ? (<Link to="/admin/students/$id" params={{ id: ent.profileId }} className="hover:underline text-primary">
                            {ent.name}
                          </Link>) : (<span>{ent.name}</span>)}
                      </TableCell>
                      <TableCell>{ent.email}</TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-foreground">{ent.university || "Not provided"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{ent.course || "Not provided"}</div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-foreground">
                        {ent.graduationYear}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs border px-2 py-0.5 rounded-full capitalize font-medium ${statusStyles[ent.status]}`}>
                          {ent.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {ent.registered && ent.profileId && (<>
                            <Button onClick={() => toggleBlock(ent.profileId, ent.blocked)} variant="outline" size="sm" className="h-8 flex items-center gap-1.5">
                              {ent.blocked ? (<>
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500"/> Unblock
                                </>) : (<>
                                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500"/> Block
                                </>)}
                            </Button>
                            <Button onClick={() => handleRemoveRegistered(ent.profileId, ent.email)} variant="destructive" size="sm" className="h-8 flex items-center gap-1.5">
                              <Trash2 className="h-3.5 w-3.5"/> Remove
                            </Button>
                          </>)}
                        {!ent.registered && ent.whitelistId && (<Button onClick={() => handleDeleteWhitelist(ent.whitelistId)} variant="destructive" size="sm" className="h-8 flex items-center gap-1.5">
                            <Trash2 className="h-3.5 w-3.5"/> Remove
                          </Button>)}
                      </TableCell>
                    </TableRow>);
            })}
              </TableBody>
            </Table>)}
        </CardContent>
      </Card>
    </div>);
}
