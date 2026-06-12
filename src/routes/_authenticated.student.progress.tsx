import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy, Star, CheckCircle2, Clock, Calendar, ArrowUpRight, Plus,
  Trash2, FileDown, Eye, Share2, Sparkles, Award, GraduationCap,
  X, BarChart3, AlertCircle, Lock, Check, ChevronRight, Edit, Flame,
  Briefcase, Users, RefreshCw, BarChart, ArrowRight, Zap, Target
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart as RechartsBarChart, Bar, Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/progress")({
  head: () => ({ meta: [{ title: "My Progress — Karta Connect" }] }),
  component: StudentProgressPage,
});

// Types & Data Structures
interface KanbanCard {
  id: string;
  title: string;
  subtitle: string;
  company: string;
  type: string;
  date: string;
  status: "applied" | "shortlisted" | "interview" | "offer" | "completed";
}

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  category: "applications" | "skills" | "networking" | "projects";
}

interface Skill {
  name: string;
  category: string;
  addedDate: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  matches: number;
}

interface ResumeVersion {
  version: string;
  date: string;
  highlight: string;
  description: string;
  skills: string[];
}

function StudentProgressPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [activityFilter, setActivityFilter] = useState<"30d" | "3m" | "1y">("30d");
  const [activeInsightTab, setActiveInsightTab] = useState<"all" | "growth" | "opportunities" | "skills" | "networking">("all");

  // Modals & Popovers state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string }>({ v1: "Version 4", v2: "Version 5" });

  // 1. Kanban Board State (Section 4)
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([
    { id: "kb-1", title: "Google Internship", subtitle: "Software Engineering Intern", company: "Google", type: "Internship", date: "10 Jun 2026", status: "applied" },
    { id: "kb-2", title: "UNICEF Research Program", subtitle: "Data Science Fellowship", company: "UNICEF", type: "Fellowship", date: "08 Jun 2026", status: "applied" },
    { id: "kb-3", title: "Deloitte Analyst Program", subtitle: "Tech Advisory Analyst", company: "Deloitte", type: "Full-Time", date: "01 Jun 2026", status: "shortlisted" },
    { id: "kb-4", title: "EY Consulting Internship", subtitle: "Strategy & Transactions Intern", company: "EY", type: "Internship", date: "28 May 2026", status: "shortlisted" },
    { id: "kb-5", title: "Bellurbis Software Internship", subtitle: "Frontend React Developer", company: "Bellurbis", type: "Internship", date: "24 May 2026", status: "interview" },
    { id: "kb-6", title: "Amazon SDE Internship", subtitle: "Software Development Engineer Intern", company: "Amazon", type: "Internship", date: "15 May 2026", status: "offer" },
    { id: "kb-7", title: "AI Research Fellowship", subtitle: "NLP Scholar", company: "Karta Foundation", type: "Fellowship", date: "10 Apr 2026", status: "completed" },
  ]);

  // 2. Career Goals State (Section 6)
  const [goals, setGoals] = useState<Goal[]>([
    { id: "g-1", title: "Apply to 5 Internships", current: 4, target: 5, unit: "applications", deadline: "30 Jun 2026", category: "applications" },
    { id: "g-2", title: "Learn React.js", current: 60, target: 100, unit: "%", deadline: "15 Jul 2026", category: "skills" },
    { id: "g-3", title: "Complete Machine Learning Certification", current: 100, target: 100, unit: "%", deadline: "01 Jun 2026", category: "projects" },
    { id: "g-4", title: "Build Portfolio Website", current: 75, target: 100, unit: "%", deadline: "20 Jun 2026", category: "projects" },
    { id: "g-5", title: "Connect with 50 Professionals", current: 20, target: 50, unit: "connections", deadline: "31 Jul 2026", category: "networking" },
  ]);

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: "",
    target: 5,
    current: 0,
    unit: "applications",
    deadline: "2026-07-31",
    category: "applications" as any
  });
  // Skills from Database
  const { user } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    async function loadSkills() {
      if (!user) return;
      const { data } = await supabase
        .from("student_profiles")
        .select("skills")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSkills(data.skills || []);
      }
    }

    if (user) loadSkills();
  }, [user]);

  // Skills state (Section 2)
  const skillsData: Skill[] = [
    { name: "React.js", category: "Frontend", addedDate: "12 May 2026", level: "Intermediate", matches: 28 },
    { name: "Machine Learning", category: "Data Science", addedDate: "20 Apr 2026", level: "Advanced", matches: 15 },
    { name: "Python", category: "Programming", addedDate: "05 Mar 2026", level: "Expert", matches: 42 },
    { name: "Financial Modelling", category: "Finance", addedDate: "18 Feb 2026", level: "Intermediate", matches: 8 },
    { name: "Leadership", category: "Soft Skills", addedDate: "10 Jan 2026", level: "Advanced", matches: 31 },
    { name: "Data Analysis", category: "Data Science", addedDate: "22 Mar 2026", level: "Advanced", matches: 22 },
    { name: "Communication", category: "Soft Skills", addedDate: "15 Jan 2026", level: "Expert", matches: 50 },
    { name: "Node.js", category: "Backend", addedDate: "29 May 2026", level: "Beginner", matches: 19 },
  ];

  // Resume Versions (Section 5)
  const resumeVersions: ResumeVersion[] = [
    { version: "Version 5", date: "15 May 2026", highlight: "Added AI Projects", description: "Updated experience with AI Research Fellowship details and NLP models project.", skills: ["Python", "PyTorch", "NLP", "Machine Learning"] },
    { version: "Version 4", date: "20 Apr 2026", highlight: "Added Internship Experience", description: "Incorporated Bellurbis Frontend development internship achievements and React details.", skills: ["React.js", "Tailwind CSS", "JavaScript", "TypeScript"] },
    { version: "Version 3", date: "05 Mar 2026", highlight: "Added Certifications", description: "Added Coursera Machine Learning and Financial Modelling credentials.", skills: ["Python", "Financial Analysis", "Machine Learning"] },
  ];

  // Activity Overview Chart Data based on selected filter (Section 3)
  const activityChartData = {
    "30d": [
      { name: "Posts Created", count: 14 },
      { name: "Connections Made", count: 23 },
      { name: "Applications Submitted", count: 8 },
      { name: "Profile Updates", count: 5 },
    ],
    "3m": [
      { name: "Posts Created", count: 38 },
      { name: "Connections Made", count: 65 },
      { name: "Applications Submitted", count: 24 },
      { name: "Profile Updates", count: 12 },
    ],
    "1y": [
      { name: "Posts Created", count: 120 },
      { name: "Connections Made", count: 210 },
      { name: "Applications Submitted", count: 78 },
      { name: "Profile Updates", count: 32 },
    ],
  };

  const activityStats = {
    "30d": { posts: 14, connections: 23, apps: 8, updates: 5, trends: { posts: "+12%", connections: "+18%", apps: "+25%", updates: "+66%" } },
    "3m": { posts: 38, connections: 65, apps: 24, updates: 12, trends: { posts: "+8%", connections: "+14%", apps: "+19%", updates: "+20%" } },
    "1y": { posts: 120, connections: 210, apps: 78, updates: 32, trends: { posts: "+45%", connections: "+32%", apps: "+52%", updates: "+15%" } },
  };

  // Skill Growth Timeline Chart Data (Section 2)
  const skillGrowthData = [
    { name: "Jan", skills: 8 },
    { name: "Feb", skills: 11 },
    { name: "Mar", skills: 14 },
    { name: "Apr", skills: 18 },
    { name: "May", skills: 22 },
    { name: "Jun", skills: 24 },
  ];

  // AI Growth Insights (Section 7)
  const aiInsights = [
    { id: "ai-1", category: "growth", text: "Your profile visibility increased by 18% this month.", impact: "+18% Visibility", action: "Optimize Profile" },
    { id: "ai-2", category: "skills", text: "Adding 2 more projects could increase profile completion to 95%.", impact: "+10% Completion", action: "Add Project" },
    { id: "ai-3", category: "opportunities", text: "React.js and Python are the most requested skills in your saved opportunities.", impact: "High Match", action: "Apply Now" },
    { id: "ai-4", category: "networking", text: "Scholars with similar profiles typically have 4 certifications.", impact: "Benchmark Match", action: "Explore Certifications" },
    { id: "ai-5", category: "growth", text: "Completing your current goals may increase opportunity matching score by 22%.", impact: "+22% Match Score", action: "Review Goals" },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // HTML5 Drag & Drop handlers for Kanban Board
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: KanbanCard["status"]) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/plain");

    // Update card status
    setKanbanCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: targetStatus, date: "Today" } : c))
    );

    const movedCard = kanbanCards.find(c => c.id === cardId);
    if (movedCard) {
      toast.success(`Moved "${movedCard.title}" to ${targetStatus.toUpperCase()}`);
    }
  };

  // Move card using dropdown/button actions (for accessibility & mobile support)
  const moveCard = (cardId: string, targetStatus: KanbanCard["status"]) => {
    setKanbanCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: targetStatus, date: "Today" } : c))
    );
    toast.success("Opportunity column updated successfully");
  };

  // Goal updates
  const adjustGoalProgress = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newProgress = Math.max(0, Math.min(g.target, g.current + amount));
        if (newProgress === g.target && g.current < g.target) {
          toast.success(`🎉 Goal Completed: "${g.title}"!`);
        }
        return { ...g, current: newProgress };
      })
    );
  };

  const addNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) {
      toast.error("Please enter a goal title.");
      return;
    }
    const created: Goal = {
      id: `g-${Date.now()}`,
      title: newGoal.title,
      current: Number(newGoal.current),
      target: Number(newGoal.target),
      unit: newGoal.unit,
      deadline: new Date(newGoal.deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }),
      category: newGoal.category
    };

    setGoals((prev) => [...prev, created]);
    setIsGoalModalOpen(false);
    setNewGoal({
      title: "",
      target: 5,
      current: 0,
      unit: "applications",
      deadline: "2026-07-31",
      category: "applications"
    });
    toast.success("New career goal created!");
  };

  // Export PDF Progress Report
  const handleExportPDF = () => {
    toast.info("Generating Progress Report PDF...", {
      description: "Compiling metrics, goal statuses, and skill analytics.",
    });
    setTimeout(() => {
      toast.success("PDF Downloaded successfully!", {
        description: "Karta_Connect_Progress_Report_" + Date.now().toString() + ".pdf"
      });
    }, 2000);
  };

  // Share Progress
  const handleShareProgress = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Progress profile link copied to clipboard!", {
      description: "You can now share your achievements with mentors and employers."
    });
  };

  // Modal handlers
  const handleCompare = (v1: string, v2: string) => {
    setCompareVersions({ v1, v2 });
    setIsCompareModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 bg-background text-foreground p-6 md:p-8 rounded-2xl border border-border/30 shadow-lg -mx-6 md:-mx-8 my-0 min-h-[calc(100vh-3rem)] relative overflow-x-hidden overflow-y-auto">

      {/* Visual background lights for glassmorphism glow effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[160px] pointer-events-none" />

      {/* ----------------- PAGE HEADER & TOP ACTIONS ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            My Progress
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base font-medium">
            Track your professional growth, achievements, opportunities, and career journey.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleShareProgress}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" /> Share Progress
          </Button>
          <Button
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <FileDown className="h-4 w-4 text-slate-950" /> Export PDF Report
          </Button>
        </div>
      </div>

      {/* ----------------- SECTION 1: OVERVIEW METRICS ----------------- */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 overflow-x-auto relative z-10">
        {/* Card 1: Profile Completion */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Completion</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">

              <div className="relative flex items-center justify-center w-20 h-20 shrink-0">
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 80 80"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="6"
                    className="stroke-slate-800 fill-none"
                  />

                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    strokeWidth="6"
                    className="stroke-amber-400 fill-none"
                    strokeDasharray={213.6}
                    strokeDashoffset={32}
                    strokeLinecap="round"
                  />
                </svg>

                <span className="absolute text-base font-bold leading-none">
                  85%
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  5% this month
                </span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Card 2: Skills Added */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skills Added</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{skills.length} Skills</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <Plus className="h-3 w-3 inline" />4 this month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Active Applications */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">12 Active</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" /> 1 interview pending
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Goals Achieved */}
        <Card id="goals-achieved-card" className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Goals Achieved</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {/* Calculate completed goals */}
            {(() => {
              const completedGoals = goals.filter(g => g.current >= g.target);
              const completed = completedGoals.length;
              const total = goals.length;
              const percent = total ? Math.round((completed / total) * 100) : 0;
              return (
                <>
                  <div className="text-3xl font-black text-foreground">{completed}/{total}</div>
                  <div className="mt-3">
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex relative">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] text-slate-500 font-bold">{percent}% COMPLETED</span>
                      <span className="text-[10px] text-amber-400 font-bold">{total - completed} IN PROGRESS</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ----------------- SECTION 2 & SECTION 9: CHART & SUMMARY ROW ----------------- */}
      <div className="grid gap-6 lg:grid-cols-3 relative z-10">

        {/* SECTION 2: Skill Growth Timeline */}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Skill Growth Journey</h2>
                <p className="text-xs text-slate-400 mt-0.5">Visualize your cumulative skill acquisition history.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px] text-slate-400 font-bold flex gap-2">
                <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-200">2026 Cumulative</span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 mt-2">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={skillGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E2B13C" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E2B13C" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 30]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                      labelClassName="text-slate-400 font-bold text-xs"
                    />
                    <Area type="monotone" dataKey="skills" stroke="#E2B13C" strokeWidth={3} fillOpacity={1} fill="url(#colorSkills)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Skill Tag list */}
          <div className="mt-6 border-t border-slate-800/60 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recently Added Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skillsData.map((sk) => (
                <button
                  key={sk.name}
                  onClick={() => setSelectedSkill(selectedSkill?.name === sk.name ? null : sk)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 flex items-center gap-1.5 ${selectedSkill?.name === sk.name
                    ? "bg-amber-400/20 border-amber-400 text-amber-300 shadow-md shadow-amber-400/5"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60"
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {sk.name}
                </button>
              ))}
            </div>

            {/* Clicked Skill Stats Detail Card */}
            {/* {selectedSkill && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 animate-in slide-in-from-top-2 duration-300 relative">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Skill</span>
                    <h5 className="text-sm font-bold text-slate-200">{selectedSkill.name}</h5>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Proficiency</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 rounded font-semibold text-amber-400 block w-max mt-0.5">
                      {selectedSkill.level}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Category</span>
                    <h5 className="text-xs text-slate-300 mt-1 font-medium">{selectedSkill.category}</h5>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Job Matches</span>
                    <h5 className="text-xs text-emerald-400 font-bold mt-1">{selectedSkill.matches} Positions</h5>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* SECTION 9: Personal Growth Summary */}
        <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Personal Growth Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">A comprehensive assessment of your career readiness.</p>

            {/* SVG Speedometer/Radial Score Visualization */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-40 h-28 flex items-end justify-center overflow-hidden">
                <svg className="w-40 h-40 absolute left-3 top-0">
                  <defs>
                    <linearGradient id="radialGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E2B13C" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  {/* Gauge Arc */}
                  <path d="M 12 80 A 68 68 0 0 1 148 80" className="stroke-slate-800 fill-none" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 12 80 A 68 68 0 0 1 148 80" className="stroke-amber-400 fill-none" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 68}`}
                    strokeDashoffset={`${Math.PI * 68 * (1 - 0.87)}`}
                  />
                </svg>
                <div className="absolute left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2 text-center z-10">
                  <span className="text-3xl font-black text-slate-100">87</span>
                  <span className="text-slate-500 text-xs font-bold block">GROWTH SCORE</span>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs font-bold px-3 py-1 bg-amber-400/10 text-amber-400 rounded-full border border-amber-400/25">
                  Career Readiness: Advanced
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-800/60 pt-4">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Top Strengths</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["Problem Solving", "Leadership", "Machine Learning", "Communication"].map((str) => (
                  <span key={str} className="text-xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-medium">
                    {str}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Improvement Areas</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["Public Speaking", "Cloud Technologies"].map((imp) => (
                  <span key={imp} className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md font-medium">
                    {imp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ----------------- SECTION 3: ACTIVITY ANALYTICS ----------------- */}
      <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Activity Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">Comparative analytics of your platform contributions and actions.</p>
          </div>
          <div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as any)}
              className="bg-slate-900/90 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="30d">Last 30 Days</option>
              <option value="3m">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-center">
          {/* Recharts Bar Chart */}
          <div className="md:col-span-2 h-64">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={activityChartData[activityFilter]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#f8fafc" }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {activityChartData[activityFilter].map((entry, index) => {
                      const colors = ["#E2B13C", "#3b82f6", "#10b981", "#8b5cf6"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Under Chart Display */}
          <div className="space-y-4 bg-slate-950/40 border border-slate-800/60 p-5 rounded-2xl">
            <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pb-1 border-b border-slate-800">
              Activity Metrics Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Posts Created</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-[#E2B13C]">{activityStats[activityFilter].posts}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{activityStats[activityFilter].trends.posts}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Connections Made</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-blue-400">{activityStats[activityFilter].connections}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{activityStats[activityFilter].trends.connections}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Applications</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-emerald-400">{activityStats[activityFilter].apps}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{activityStats[activityFilter].trends.apps}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Profile Updates</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-bold text-purple-400">{activityStats[activityFilter].updates}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{activityStats[activityFilter].trends.updates}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- SECTION 4: OPPORTUNITY PROGRESS TRACKER (KANBAN) ----------------- */}
      <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl relative z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Opportunity Journey</h2>
          <p className="text-xs text-slate-400 mt-0.5">Drag and drop cards or select actions to update application stages.</p>
        </div>

        {/* Kanban Board Layout */}
        <div className="grid gap-4 mt-6 overflow-x-auto grid-cols-5 min-w-[950px] pb-4">

          {/* Columns configuration */}
          {(["applied", "shortlisted", "interview", "offer", "completed"] as const).map((status) => {
            const columnsInfo = {
              applied: { title: "Applied", border: "border-slate-800", text: "text-blue-400", bg: "bg-blue-400/5", badge: "bg-blue-400/10" },
              shortlisted: { title: "Shortlisted", border: "border-slate-800", text: "text-amber-400", bg: "bg-amber-400/5", badge: "bg-amber-400/10" },
              interview: { title: "Interview Requested", border: "border-slate-800", text: "text-purple-400", bg: "bg-purple-400/5", badge: "bg-purple-400/10" },
              offer: { title: "Offer Received", border: "border-emerald-500/20", text: "text-emerald-400", bg: "bg-emerald-400/5", badge: "bg-emerald-400/10" },
              completed: { title: "Completed", border: "border-slate-850", text: "text-slate-400", bg: "bg-slate-800/5", badge: "bg-slate-700/10" }
            }[status];

            const colCards = kanbanCards.filter((c) => c.status === status);

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex flex-col min-h-[350px] rounded-xl border ${columnsInfo.border} bg-slate-900/10 backdrop-blur-sm p-3 transition-colors duration-200`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/50 mb-3">
                  <span className={`text-xs font-black uppercase tracking-wider ${columnsInfo.text}`}>
                    {columnsInfo.title}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${columnsInfo.text} ${columnsInfo.badge}`}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3">
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      className="group relative bg-slate-900/90 border border-slate-800 hover:border-amber-400/30 rounded-xl p-3.5 shadow-md hover:shadow-lg transition-all duration-300 cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{card.company}</span>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md">
                          {card.type}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1.5 group-hover:text-[#E2B13C] transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium line-clamp-1">{card.subtitle}</p>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                        <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {card.date}
                        </span>

                        {/* Quick Column Change Actions */}
                        <div className="relative group/actions">
                          <button className="text-[9px] font-bold text-amber-400 hover:underline px-1.5 py-0.5 bg-amber-400/10 rounded">
                            Stage
                          </button>
                          <div className="hidden group-hover/actions:flex flex-col absolute bottom-full right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-xl p-1 z-30 w-32 space-y-0.5 text-left">
                            {(["applied", "shortlisted", "interview", "offer", "completed"] as const).map((opt) => (
                              <button
                                key={opt}
                                onClick={() => moveCard(card.id, opt)}
                                className="text-[10px] px-2 py-1 hover:bg-slate-900 rounded font-bold text-slate-300 text-left capitalize"
                              >
                                Move to {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colCards.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-slate-600 mb-1" />
                      <span className="text-[10px] text-slate-500 font-semibold">Drag cards here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------- SECTION 5 & SECTION 6: RESUME & GOALS ROW ----------------- */}
      <div className="grid gap-6 md:grid-cols-2 relative z-10">

        {/* SECTION 5: Resume Evolution */}
        <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Resume Evolution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Track your resume modifications and download history.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </div>

          {/* Timeline component */}
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {resumeVersions.map((item, idx) => (
              <div key={item.version} className="relative pl-6">
                {/* Milestone Node */}
                <div className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center ${idx === 0 ? "border-[#E2B13C] shadow-lg shadow-amber-400/20" : "border-slate-700"
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? "bg-[#E2B13C]" : "bg-slate-600"}`} />
                </div>

                <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-750 p-4 rounded-xl transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-black text-slate-200">{item.version}</span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {item.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-amber-400">{item.highlight}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">{item.description}</p>

                  {/* Skill tags in version */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {item.skills.map(sk => (
                      <span key={sk} className="text-[9px] px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 rounded">
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/40">
                    <button
                      onClick={() => toast.success(`Viewing ${item.version} resume details`)}
                      className="text-[10px] font-bold text-slate-300 hover:text-slate-100 flex items-center gap-1 hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    <button
                      onClick={() => toast.success(`Downloading ${item.version} PDF...`)}
                      className="text-[10px] font-bold text-slate-300 hover:text-slate-100 flex items-center gap-1 hover:underline"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Download
                    </button>
                    {idx < resumeVersions.length - 1 && (
                      <button
                        onClick={() => handleCompare(item.version, resumeVersions[idx + 1].version)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline ml-auto"
                      >
                        <RefreshCw className="h-3 w-3" /> Compare
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6: Goals Tracker */}
        <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100">My Career Goals</h2>
                <p className="text-xs text-slate-400 mt-0.5">Set, adjust progress, and hit milestones.</p>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20 rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Goal
              </button>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
              {goals.map((goal) => {
                const percent = Math.round((goal.current / goal.target) * 100);
                const isCompleted = goal.current >= goal.target;

           return (
                  <div key={goal.id} className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-xl hover:border-slate-700/60 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <div className="bg-emerald-500/10 p-1 rounded-md text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="bg-amber-500/10 p-1 rounded-md text-amber-400">
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <h4 className={`text-xs font-bold ${isCompleted ? "text-slate-400 line-through" : "text-slate-200"}`}>
                          {goal.title}
                        </h4>
                      </div>

                      {isCompleted ? (
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      )}
                    </div>
                    {/* Button to view in Achieved Goals card */}
                    <div className="flex justify-end">
                      <a href="#goals-achieved-card" className="text-amber-400 hover:underline text-xs font-medium">View in Achievements</a>
                    </div>

                    {/* Progress Slider Display */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-amber-400 to-amber-600"}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/40">
                      <span className="text-[9px] text-slate-500 font-bold">
                        DEADLINE: {goal.deadline}
                      </span>

                      {/* Plus / Minus interactive progress adjustments */}
                      {!isCompleted && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => adjustGoalProgress(goal.id, -1)}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 h-6 w-6 rounded border border-slate-800 flex items-center justify-center"
                          >
                            -
                          </button>
                          <button
                            onClick={() => adjustGoalProgress(goal.id, 1)}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 h-6 w-6 rounded border border-slate-800 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Overall Score: 60% Goals Met</span>
            <span>2 In Progress</span>
          </div>
        </div>

      </div>

      {/* ----------------- SECTION 7: AI GROWTH INSIGHTS ----------------- */}
      <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800/60 mb-6 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-400/10 p-2 rounded-xl text-amber-400 shadow-md shadow-amber-400/5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                AI Growth Insights
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Personalized recommendations compiled from job markets and peer data.</p>
            </div>
          </div>

          {/* Insight category filters */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-[11px] font-bold">
            {(["all", "growth", "opportunities", "skills", "networking"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveInsightTab(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${activeInsightTab === tab
                  ? "bg-slate-800 text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Insight Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiInsights
            .filter((item) => activeInsightTab === "all" || item.category === activeInsightTab)
            .map((item, index) => {
              const bgColors = {
                growth: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400",
                skills: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
                opportunities: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
                networking: "from-purple-500/10 to-transparent border-purple-500/20 text-purple-400"
              }[item.category as "growth" | "skills" | "opportunities" | "networking"];

              return (
                <div
                  key={item.id}
                  className={`bg-gradient-to-br ${bgColors} bg-slate-900/30 border p-5 rounded-2xl flex flex-col justify-between group hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-0.5`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                        {item.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed mt-2.5">💡 {item.text}</p>
                  </div>

                  <button
                    onClick={() => {
                      toast.success(`Action initiated: "${item.action}"`, {
                        description: "Navigating to relevant tools or applying parameters."
                      });
                    }}
                    className="mt-5 text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 border-t border-slate-850 pt-3 text-left w-full group-hover:underline justify-between"
                  >
                    <span>{item.action}</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* ----------------- SECTION 8: ACHIEVEMENT MILESTONES ----------------- */}
      <div className="bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-xl border border-slate-850 rounded-2xl p-6 shadow-xl relative z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Milestones & Achievements</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gamified milestone badge matrix representing your path of progress.</p>
        </div>

        {/* Badges Layout Grid */}
        <div className="grid gap-4 mt-6 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">

          {/* Unlocked Badges */}
          {[
            { title: "Profile 80%", subtitle: "Profile 80% Complete", icon: "🏆", desc: "Successfully filled academic and project details." },
            { title: "First Application", subtitle: "First Application Submitted", icon: "🏆", desc: "Submitted initial opportunity to partner company." },
            { title: "First Interview", subtitle: "First Interview Received", icon: "🏆", desc: "Shortlisted and invited for partner developers." },
            { title: "Top Contributor", subtitle: "Top Contributor Status", icon: "🏆", desc: "Active in scholar forums and community discussions." },
            { title: "50 Connections", subtitle: "50 Connections Reached", icon: "🏆", desc: "Expanded scholar network to 50 active professionals." }
          ].map((badge) => (
            <div
              key={badge.title}
              onClick={() => toast.info(badge.subtitle, { description: badge.desc })}
              className="bg-gradient-to-b from-amber-500/10 to-amber-600/5 hover:from-amber-500/20 border border-amber-400/20 rounded-2xl p-4 text-center cursor-pointer hover:border-amber-400/40 transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col items-center justify-center gap-2 group"
            >
              <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                {badge.icon}
              </div>
              <h4 className="text-[11px] font-black text-amber-300 tracking-tight leading-tight">
                {badge.title}
              </h4>
              <span className="text-[9px] text-emerald-400 font-bold">UNLOCKED</span>
            </div>
          ))}

          {/* Locked Badges */}
          {[
            { title: "100 Connections", target: "100 Connections", icon: "🔒", current: 50, goal: 100 },
            { title: "10 Projects", target: "10 Completed Projects", icon: "🔒", current: 4, goal: 10 },
            { title: "5 Offers", target: "5 Internship Offers", icon: "🔒", current: 1, goal: 5 }
          ].map((badge) => {
            const pct = Math.round((badge.current / badge.goal) * 100);

            return (
              <div
                key={badge.title}
                onClick={() => toast.info(`Locked: ${badge.target}`, { description: `Currently at ${badge.current}/${badge.goal}. Keep climbing!` })}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-center cursor-pointer hover:border-slate-700/80 transition-all duration-300 flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="text-2xl opacity-40 group-hover:scale-110 transition-transform">
                  {badge.icon}
                </div>
                <h4 className="text-[11px] font-bold text-slate-500 tracking-tight leading-tight">
                  {badge.title}
                </h4>

                {/* Progress toward locked badge */}
                <div className="w-full mt-1.5 space-y-1">
                  <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                    <div className="bg-slate-700 h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="text-[8px] text-slate-600 font-black block">
                    {pct}% COMPLETE
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------- SECTION 10: MONTHLY SNAPSHOT ----------------- */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-slate-900/40 border border-slate-850 rounded-2xl p-6 shadow-xl relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-400" /> Monthly Snapshot
          </h2>
          <p className="text-xs text-slate-400 mt-1">Here is a quick look at your accomplishments and metrics added during June 2026.</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 mt-6">
            <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Apps Submitted</span>
              <span className="text-lg font-black text-slate-200 mt-0.5 block">8</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Interviews</span>
              <span className="text-lg font-black text-slate-200 mt-0.5 block">2</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Skills Added</span>
              <span className="text-lg font-black text-slate-200 mt-0.5 block">4</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Connections</span>
              <span className="text-lg font-black text-slate-200 mt-0.5 block">23</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Goals Met</span>
              <span className="text-lg font-black text-emerald-400 mt-0.5 block">1</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-center">
          <Button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-400/5 hover:shadow-amber-400/15"
          >
            View Detailed Report
          </Button>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* ----------------- DIALOG / MODAL WINDOWS (INTERACTIVE) ----------------- */}
      {/* ========================================================================= */}

      {/* MODAL 1: CREATE GOAL MODAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-4.5 w-4.5 text-amber-400" /> Create Career Goal
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={addNewGoal} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Goal Title / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Learn System Design basics"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Goal Metric Unit
                  </label>
                  <select
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none transition-colors"
                  >
                    <option value="applications">Applications</option>
                    <option value="%">Percent (%)</option>
                    <option value="connections">Connections</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Category Group
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400/50 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none transition-colors"
                  >
                    <option value="applications">Applications</option>
                    <option value="skills">Skills</option>
                    <option value="networking">Networking</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESUME COMPARISON DIFF MODAL */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-amber-400 animate-spin-slow" /> Resume Comparison Analysis
              </h3>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-800 bg-slate-950/50 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Base Version</span>
                  <h4 className="text-sm font-black text-slate-300 mt-1">{compareVersions.v2}</h4>
                  <div className="mt-3 text-xs space-y-2">
                    <div className="p-2 bg-slate-900 rounded font-semibold text-slate-400">Added Internship Experience</div>
                    <div className="flex flex-wrap gap-1">
                      {["React.js", "Tailwind CSS", "TypeScript"].map(t => (
                        <span key={t} className="text-[9px] px-1 bg-slate-900 text-slate-400 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-amber-400/20 bg-slate-900/40 p-4 rounded-xl">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Current Version</span>
                  <h4 className="text-sm font-black text-amber-400 mt-1">{compareVersions.v1}</h4>
                  <div className="mt-3 text-xs space-y-2">
                    <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded font-bold text-amber-300">Added AI Projects</div>
                    <div className="flex flex-wrap gap-1">
                      {["Python", "PyTorch", "NLP", "Machine Learning"].map(t => (
                        <span key={t} className="text-[9px] px-1 bg-amber-400/10 text-amber-400 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compare Insights */}
              <div className="bg-amber-400/5 border border-amber-400/10 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> Evolution Insights & Impact
                </h5>
                <ul className="text-xs text-slate-300 mt-2.5 space-y-2 list-disc pl-4 font-medium leading-relaxed">
                  <li>Added <span className="text-emerald-400 font-bold">NLP & PyTorch</span> keywords, expanding job indexing matches by 28%.</li>
                  <li>Reordered technical skills grid to highlight advanced machine learning first.</li>
                  <li>Enhanced description bullet points to follow the <span className="text-amber-400 font-bold">Google XY Formula</span> (Accomplished X, measured by Y, by doing Z).</li>
                </ul>
              </div>

              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MONTHLY DETAILED REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="h-4.5 w-4.5 text-amber-400" /> Scholar Performance Report (June 2026)
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 hover:bg-slate-800/60 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* Snapshot header */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Scholar Name</span>
                  <h4 className="text-sm font-black text-slate-200 mt-0.5">Vaibhav Kumar</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Cohort</span>
                  <h4 className="text-sm font-black text-amber-400 mt-0.5">Karta Scholars '26</h4>
                </div>
              </div>

              {/* Performance Metrics list */}
              <div className="space-y-3">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Performance Breakdown</h5>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-300">Applications Select Rate</span>
                    <span className="text-emerald-400 font-black">25.0% (2 of 8 shortlisted)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-300">Profile Visibility Increment</span>
                    <span className="text-emerald-400 font-black">+18% profile view counts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-300">Avg response speed</span>
                    <span className="text-slate-200 font-black">24 hours (Excellent)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold p-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                    <span className="text-slate-300">Goal Achievement Index</span>
                    <span className="text-amber-400 font-black">80% on-time completion score</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-xl">
                <h6 className="text-[11px] font-bold text-slate-300 uppercase">Mentor Assessment Feedback</h6>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2 italic">
                  "Vaibhav is demonstrating excellent technical momentum. His progression in python data science matching is outstanding. We recommend dedicating the next month to strengthening resume communications and starting system designs preparation."
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-colors"
                >
                  Close Report
                </button>
                <button
                  onClick={() => {
                    toast.success("Detailed Performance Certificate Generated!");
                    setIsReportModalOpen(false);
                  }}
                  className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
