import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Get the current user's role from Supabase
 */
export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw redirect({ to: "/login" });
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, role: roleData?.role || null };
}

/**
 * Guard for admin-only routes
 */
export async function requireAdmin() {
  const { user, role } = await getUserRole();
  
  if (role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role };
}

/**
 * Guard for student-only routes
 */
export async function requireStudent() {
  const { user, role } = await getUserRole();
  
  if (role !== "student") {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role };
}

/**
 * Guard for company-only routes
 */
export async function requireCompany() {
  const { user, role } = await getUserRole();
  
  if (role !== "company") {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role };
}

/**
 * Guard for student viewing their own profile
 */
export async function requireStudentProfile(studentId) {
  const { user, role } = await getUserRole();
  
  if (role !== "student" || user.id !== studentId) {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role };
}

/**
 * Guard for company ownership of resource
 */
export async function requireCompanyOwner(companyId) {
  const { user, role } = await getUserRole();
  
  if (role !== "company") {
    throw redirect({ to: "/dashboard" });
  }

  // Verify user owns this company
  const { data: company } = await supabase
    .from("companies")
    .select("owner_user_id")
    .eq("id", companyId)
    .maybeSingle();

  if (!company || company.owner_user_id !== user.id) {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role, company };
}

/**
 * Get user's company (for companies)
 */
export async function getUserCompany() {
  const { user, role } = await getUserRole();
  
  if (role !== "company") {
    throw redirect({ to: "/dashboard" });
  }

  // Get company owned by this user
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!company) {
    throw redirect({ to: "/dashboard" });
  }

  return { user, role, company };
}
