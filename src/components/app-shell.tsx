import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, User, Briefcase, GraduationCap, FileText, Settings, LogOut,
  Building2, Users, Megaphone, ClipboardList, Sun, Moon, Bookmark, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { signOut, useAuth, type AppRole } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

type Item = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; search?: Record<string, string> };

const NAV: Record<AppRole, Item[]> = {
  student: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/profile", label: "Profile", icon: User },
    { to: "/student/saved", label: "Saved Posts", icon: Bookmark },
    { to: "/student/applications", label: "Applications", icon: FileText },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  company: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/company/profile", label: "Company Profile", icon: Building2 },
    { to: "/company/posts", label: "Job Posts", icon: Briefcase, search: { type: "job" } },
    { to: "/company/posts", label: "Internship Posts", icon: GraduationCap, search: { type: "internship" } },
    { to: "/company/applications", label: "Applicants", icon: ClipboardList },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/companies", label: "Companies", icon: Building2 },
    { to: "/admin/posts", label: "Postings", icon: Briefcase },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
};

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (typeof window !== "undefined" && localStorage.getItem("theme") === "dark" ? "dark" : "light"),
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> });
  const items = role ? NAV[role] : [];
  const { theme, toggle } = useTheme();

  const isActive = (it: Item) => {
    if (it.to !== path) return false;
    if (!it.search) return !search?.type || (it.to !== "/student/jobs" && it.to !== "/company/posts" && it.to !== "/admin/posts");
    return search?.type === it.search.type;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2 text-primary">
              <div className="bg-white rounded-md p-1 shadow-sm border border-slate-100 flex items-center justify-center h-7 w-7 shrink-0">
                <img src="/karta-logo.png" className="h-full w-full object-contain" alt="Karta Logo" />
              </div>
              <span className="font-bold group-data-[collapsible=icon]:hidden text-foreground">Karta Connect</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((it) => (
                    <SidebarMenuItem key={it.label}>
                      <SidebarMenuButton asChild isActive={isActive(it)} tooltip={it.label}>
                        <Link to={it.to} search={it.search as any}>
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut().then(() => (window.location.href = "/"))} tooltip="Logout">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground capitalize">{role}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            </div>
          </header>
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
