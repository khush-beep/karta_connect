import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

// Helper to get an authenticated admin client for server-side operations bypassing RLS
async function getAdminClient() {
  const ws = typeof window === "undefined" ? "ws" : null;
  const wsTransport = ws ? (await import(/* @vite-ignore */ ws)).default : null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    ...(wsTransport ? { realtime: { transport: wsTransport } } : {}),
  });

  const { error } = await client.auth.signInWithPassword({
    email: "admin@karta.com",
    password: "Admin@123",
  });

  if (error) {
    throw new Error(`Failed to authenticate admin client: ${error.message}`);
  }

  return client;
}

export const resolveLogin = createServerFn({ method: "GET" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data?.email?.toLowerCase().trim();

    if (email === "admin@karta.com") {
      return { kind: "admin" as const, hasPassword: true };
    }

    try {
      const adminClient = await getAdminClient();

      // 1. Check if they exist in student_profiles
      const { data: studentProfile } = await adminClient
        .from("student_profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (studentProfile) {
        return { kind: "student" as const, hasPassword: true };
      }

      // 2. Check if they are whitelisted as a student but not registered
      const { data: whitelistedStudent } = await adminClient
        .from("student_whitelist")
        .select("id")
        .eq("email", email)
        .eq("used", false)
        .maybeSingle();

      if (whitelistedStudent) {
        return { kind: "student" as const, hasPassword: false };
      }

      // 3. Check if they are a company
      const { data: company } = await adminClient
        .from("companies")
        .select("owner_user_id")
        .eq("contact_email", email)
        .maybeSingle();

      if (company) {
        const hasPassword = company.owner_user_id !== null;
        return { kind: "company" as const, hasPassword };
      }

      return { kind: null, hasPassword: false };
    } catch (err) {
      console.error("Error resolving login:", err);
      return { kind: null, hasPassword: false };
    }
  });

export const createPasswordSignup = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    const password = data.password;

    try {
      const adminClient = await getAdminClient();

      // Determine the role first
      let role: "student" | "company" | null = null;
      let whitelistRow: any = null;
      let companyRow: any = null;

      // Check student whitelist
      const { data: wlStudent } = await adminClient
        .from("student_whitelist")
        .select("*")
        .eq("email", email)
        .eq("used", false)
        .maybeSingle();

      if (wlStudent) {
        role = "student";
        whitelistRow = wlStudent;
      } else {
        // Check company contact
        const { data: comp } = await adminClient
          .from("companies")
          .select("*")
          .eq("contact_email", email)
          .maybeSingle();

        if (comp && comp.owner_user_id === null) {
          role = "company";
          companyRow = comp;
        }
      }

      if (!role) {
        throw new Error("Email is not whitelisted or already registered.");
      }

      // Perform auth signUp
      const { data: authData, error: signUpError } = await adminClient.auth.signUp({
        email,
        password,
      });

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || "Failed to create authentication user.");
      }

      const newUserId = authData.user.id;

      // Assign role in user_roles
      const { error: roleError } = await adminClient.from("user_roles").insert({
        user_id: newUserId,
        role: role,
      });

      if (roleError) {
        throw new Error(`Failed to assign user role: ${roleError.message}`);
      }

      // Finish student or company specific setups
      if (role === "student" && whitelistRow) {
        // Create student profile
        const { error: profileError } = await adminClient.from("student_profiles").insert({
          user_id: newUserId,
          name: whitelistRow.name || "",
          email: email,
          location: whitelistRow.place || "",
          university: whitelistRow.university || "",
          course: whitelistRow.course || "",
          year_of_study: whitelistRow.year_of_study || "",
          graduation_year: whitelistRow.graduation_year || "",
          skills: [],
          blocked: false,
        });

        if (profileError) {
          throw new Error(`Failed to create student profile: ${profileError.message}`);
        }

        // Mark whitelist row as used
        await adminClient
          .from("student_whitelist")
          .update({ used: true })
          .eq("id", whitelistRow.id);
      } else if (role === "company" && companyRow) {
        // Link owner_user_id in companies
        const { error: companyLinkError } = await adminClient
          .from("companies")
          .update({ owner_user_id: newUserId })
          .eq("id", companyRow.id);

        if (companyLinkError) {
          throw new Error(`Failed to link company profile: ${companyLinkError.message}`);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err);
      return { success: false, error: err?.message || "Failed to complete signup" };
    }
  });

export const deleteOwnAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const userId = data.userId;
    try {
      const adminClient = await getAdminClient();

      // Clear profile data
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.from("student_profiles").delete().eq("user_id", userId);
      await adminClient.from("companies").update({ owner_user_id: null }).eq("owner_user_id", userId);

      // Delete from auth
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err: any) {
      console.error("Delete account error:", err);
      return { success: false, error: err?.message || "Failed to delete account" };
    }
  });

export const adminDeleteStudent = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; email: string }) => data)
  .handler(async ({ data }) => {
    const { userId, email } = data;
    try {
      const adminClient = await getAdminClient();

      // Delete application records first
      await adminClient.from("applications").delete().eq("student_id", userId);

      // Delete student profile
      await adminClient.from("student_profiles").delete().eq("user_id", userId);

      // Delete student whitelist by email
      await adminClient.from("student_whitelist").delete().eq("email", email.toLowerCase().trim());

      // Delete roles
      await adminClient.from("user_roles").delete().eq("user_id", userId);

      // Delete from auth
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err: any) {
      console.error("Admin delete student error:", err);
      return { success: false, error: err?.message || "Failed to delete student" };
    }
  });
