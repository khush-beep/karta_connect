const express = require("express");
const cors = require("cors");
const path = require("path");
const ws = require("ws");
globalThis.WebSocket = ws;

const { createClient } = require("@supabase/supabase-js");

// Load environment variables from the parent directory's .env file
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS to allow access from the frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);

app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "CRITICAL ERROR: Supabase URL or Service Role Key missing in .env!",
  );
}

// Helper to get an admin client that bypasses RLS

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

// 1. Resolve Login Route
app.post("/api/auth/resolve-login", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email parameter is required." });
  }

  const cleanEmail = email.toLowerCase().trim();

  if (cleanEmail === "admin@karta.com") {
    return res.json({ kind: "admin", hasPassword: true });
  }

  try {
    const adminClient = getAdminClient();

    // Check student_profiles
    const { data: studentProfile } = await adminClient
      .from("student_profiles")
      .select("user_id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (studentProfile) {
      return res.json({ kind: "student", hasPassword: true });
    }

    // Check if whitelisted student
    const { data: whitelistedStudent } = await adminClient
      .from("student_whitelist")
      .select("id")
      .eq("email", cleanEmail)
      .eq("used", false)
      .maybeSingle();

    if (whitelistedStudent) {
      return res.json({ kind: "student", hasPassword: false });
    }

    // Check company
    const { data: company } = await adminClient
      .from("companies")
      .select("owner_user_id")
      .eq("contact_email", cleanEmail)
      .maybeSingle();

    if (company) {
      const hasPassword = company.owner_user_id !== null;
      return res.json({ kind: "company", hasPassword });
    }

    return res.json({ kind: null, hasPassword: false });
  } catch (err) {
    console.error("Error resolving login:", err);
    return res
      .status(500)
      .json({ error: "Internal server error resolving email." });
  }
});

// 2. Signup / Create Password Route
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const adminClient = getAdminClient();

    let role = null;
    let whitelistRow = null;
    let companyRow = null;

    // Check whitelist
    const { data: wlStudent } = await adminClient
      .from("student_whitelist")
      .select("*")
      .eq("email", cleanEmail)
      .eq("used", false)
      .maybeSingle();

    if (wlStudent) {
      role = "student";
      whitelistRow = wlStudent;
    } else {
      // Check company
      const { data: comp } = await adminClient
        .from("companies")
        .select("*")
        .eq("contact_email", cleanEmail)
        .maybeSingle();

      if (comp && comp.owner_user_id === null) {
        role = "company";
        companyRow = comp;
      }
    }

    if (!role) {
      return res
        .status(400)
        .json({ error: "Email is not whitelisted or already registered." });
    }

    // Auth signUp
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();

    const existingUser = existingUsers.users.find(
      (u) => u.email === cleanEmail,
    );

    if (existingUser) {
      throw new Error("This account already exists. Please login instead.");
    }
    const { data: authData, error: signUpError } =
      await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
      });

    console.log("CREATED USER:", authData.user);
    console.log("EMAIL CONFIRMED AT:", authData.user?.email_confirmed_at);

    console.log(authData.user);

    console.log("AUTH DATA:", authData);
    console.log("SIGNUP ERROR:", signUpError);

    if (signUpError || !authData.user) {
      throw new Error(
        signUpError ? signUpError.message : "Failed to create auth user.",
      );
    }

    const newUserId = authData.user?.id;

    console.log("NEW USER ID:", newUserId);

    const { data: authUser } = await adminClient.from("user_roles").select("*");

    console.log("ROLE CHECK:", authUser);

    console.log("NEW USER ID:", newUserId);

    // Assign role
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: newUserId,
      role: role,
    });

    if (roleError) {
      throw new Error(`Failed to assign user role: ${roleError.message}`);
    }

    // Save profile details
    if (role === "student" && whitelistRow) {
      const { error: profileError } = await adminClient
        .from("student_profiles")
        .insert({
          user_id: newUserId,
          name: whitelistRow.name || "",
          email: cleanEmail,
          location: whitelistRow.place || "",
          university: whitelistRow.university || "",
          course: whitelistRow.course || "",
          year_of_study: whitelistRow.year_of_study || "1st Year",
          graduation_year: whitelistRow.graduation_year || "",
          skills: [],
          blocked: false,
        });

      if (profileError) {
        throw new Error(
          `Failed to create student profile: ${profileError.message}`,
        );
      }

      await adminClient
        .from("student_whitelist")
        .update({ used: true })
        .eq("id", whitelistRow.id);
    } else if (role === "company" && companyRow) {
      const { error: companyLinkError } = await adminClient
        .from("companies")
        .update({ owner_user_id: newUserId })
        .eq("id", companyRow.id);

      if (companyLinkError) {
        throw new Error(
          `Failed to link company profile: ${companyLinkError.message}`,
        );
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to complete signup." });
  }
});

// 3. Delete Own Account Route
app.post("/api/account/delete", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const adminClient = getAdminClient();

    // Clear roles and profile
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("student_profiles").delete().eq("user_id", userId);
    await adminClient
      .from("companies")
      .update({ owner_user_id: null })
      .eq("owner_user_id", userId);

    // Delete auth account
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to delete account." });
  }
});

// 4. Admin Delete Student Route
app.post("/api/admin/delete-student", async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res
      .status(400)
      .json({ error: "User ID and email parameters are required." });
  }

  try {
    const adminClient = getAdminClient();

    // Delete dependencies first
    await adminClient.from("applications").delete().eq("student_id", userId);
    await adminClient.from("student_profiles").delete().eq("user_id", userId);
    await adminClient
      .from("student_whitelist")
      .delete()
      .eq("email", email.toLowerCase().trim());
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // Delete auth user
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return res.json({ success: true });
  } catch (err) {
    console.error("Admin delete student error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to delete student." });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Karta Connect Backend listening on port ${PORT}`);
});
