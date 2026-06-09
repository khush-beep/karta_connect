import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2, Search, Plus, ShieldAlert, ShieldCheck, Loader2, Globe, Mail, Briefcase
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/companies/")({
  component: AdminCompanies,
});

function AdminCompanies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [isOpen, setIsOpen] = useState(false);

  // New company form state
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [compRes, jobsRes] = await Promise.all([
        supabase.from("companies").select("*").order("name", { ascending: true }),
        supabase.from("job_posts").select("id, company_id")
      ]);

      if (compRes.error) throw compRes.error;
      if (jobsRes.error) throw jobsRes.error;

      // Calculate job counts in memory
      const counts: Record<string, number> = {};
      jobsRes.data?.forEach((job) => {
        counts[job.company_id] = (counts[job.company_id] || 0) + 1;
      });

      setCompanies(compRes.data || []);
      setJobCounts(counts);
    } catch (err: any) {
      console.error("Error loading admin companies:", err);
      toast.error(err.message || "Failed to load corporate partners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Company Name and Contact Email are required.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("companies").insert({
        name: name.trim(),
        contact_email: email.trim().toLowerCase(),
        industry: industry.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        contact_phone: phone.trim() || null,
        description: description.trim() || null,
        blocked: false
      });

      if (error) throw error;

      toast.success("Corporate partner successfully registered!");
      setIsOpen(false);

      // Reset form
      setName("");
      setEmail("");
      setIndustry("");
      setLocation("");
      setWebsite("");
      setPhone("");
      setDescription("");

      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add company.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleBlock(companyId: string, currentBlocked: boolean) {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ blocked: !currentBlocked })
        .eq("id", companyId);

      if (error) throw error;
      toast.success(`Company successfully ${!currentBlocked ? "blocked" : "unblocked"}!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update company block status.");
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || (
      c.name.toLowerCase().includes(query) ||
      c.contact_email.toLowerCase().includes(query) ||
      (c.industry && c.industry.toLowerCase().includes(query)) ||
      (c.location && c.location.toLowerCase().includes(query))
    );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "blocked" && c.blocked) ||
      (statusFilter === "active" && !c.blocked);

    return matchesSearch && matchesStatus;
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => !c.blocked).length;
  const blockedCompanies = companies.filter((c) => c.blocked).length;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" /> Corporate Partners
          </h1>
          <p className="text-muted-foreground font-medium">Manage hiring organizations, view recruitment pipelines, and onboard brand accounts.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Partner Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Corporate Partner</DialogTitle>
              <DialogDescription>Register a new company to enable career postings and resume reviews.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddCompany} className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="comp-name">Company Name <span className="text-destructive">*</span></Label>
                  <Input id="comp-name" placeholder="e.g. Bellurbis Technology" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comp-email">Contact Email <span className="text-destructive">*</span></Label>
                  <Input id="comp-email" type="email" placeholder="hr@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="comp-industry">Industry</Label>
                  <Input id="comp-industry" placeholder="e.g. Technology / Retail" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comp-location">Location</Label>
                  <Input id="comp-location" placeholder="e.g. London, UK / Gurgaon" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="comp-website">Website URL</Label>
                  <Input id="comp-website" type="url" placeholder="https://company.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comp-phone">Contact Phone</Label>
                  <Input id="comp-phone" placeholder="e.g. +91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="comp-desc">Short Description</Label>
                <textarea
                  id="comp-desc"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Summarize company vision, hiring criteria, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button type="submit" className="w-full font-semibold" disabled={submitting}>
                  {submitting ? "Adding Organization..." : "Register Company"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Corporate Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Total Partners</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Registered organizations</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Active</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-500">{activeCompanies}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Hiring candidates</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-muted-foreground">Blocked</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-destructive">{blockedCompanies}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Accounts suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies by name, industry, location, email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-select" className="text-xs text-muted-foreground shrink-0 font-medium">Filter:</Label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
          >
            <option value="all">All Companies</option>
            <option value="active">Active only</option>
            <option value="blocked">Blocked only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">No companies found matching the criteria.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Industry / Location</TableHead>
                  <TableHead className="text-center">Active Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((c) => {
                  const jobCount = jobCounts[c.id] || 0;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">
                        <Link to="/admin/companies/$id" params={{ id: c.id }} className="hover:underline text-primary">
                          {c.name}
                        </Link>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center ml-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <Globe className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" /> {c.contact_email}
                        </div>
                        {c.contact_phone && (
                          <div className="text-xs text-muted-foreground mt-0.5">{c.contact_phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold text-foreground">{c.industry || "Not specified"}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{c.location || "Not specified"}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          <Briefcase className="h-3 w-3" /> {jobCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.blocked ? (
                          <span className="text-xs border border-destructive/20 bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-xs border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8"
                          >
                            <Link to="/admin/companies/$id" params={{ id: c.id }}>
                              Details
                            </Link>
                          </Button>
                          <Button
                            onClick={() => toggleBlock(c.id, c.blocked)}
                            variant="outline"
                            size="sm"
                            className="h-8 flex items-center gap-1.5"
                          >
                            {c.blocked ? (
                              <>
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Unblock
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Block
                              </>
                            )}
                          </Button>
                        </div>
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
