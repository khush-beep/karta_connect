# Karta Foundation — UI & Flow Upgrade Plan

A focused pass to bring the existing foundation in line with the new spec. I'll keep the existing data model and server functions; the work is mostly UI/UX, routing, and a couple of small backend helpers.

## 1. Authentication & onboarding

- **Single login page** at `/login`: Email + Password + Login (Google button stays as a secondary option since it was previously added — let me know if you want it removed).
- **Smart login flow** (new server function `resolveLogin(email)`):
  1. If email matches `student_whitelist` or `companies.contact_email` and no auth user exists yet → redirect to `/create-password?email=…` (new page) that runs `signUp` and assigns role from the matched table.
  2. If auth user exists → normal `signInWithPassword`, then route by role.
- **Role redirect**: after login go to `/dashboard` which fans out by role (existing behavior, kept).
- **Default admin**: seed `admin@karta.com` / `Admin@123` via a migration (creates auth user + `admin` role). Shown on the login page as a hint banner during first run.
- Remove the public `/signup` route (students no longer self-signup; flow handled by create-password).

## 2. Layout: left sidebar everywhere

- Replace `AppShell` (top nav) with a `SidebarShell` built on the existing shadcn sidebar. Mini-collapsible.
- **Common items**: Dashboard, Profile, Settings, Logout.
- **Admin extras**: Students, Companies, Job Posts, Internship Posts.
- **Student extras**: Jobs, Internships, Applications.
- **Company extras**: Company Profile, Job Posts, Internship Posts, Applicants.
- Split current combined "Posts" routes into Jobs vs Internships using a `?type=` filter (one route, two sidebar entries).

## 3. Settings page (`/_authenticated/settings`)

New shared page for all roles with sections:
- Edit account details (name/email display, change via re-auth)
- Change password (`supabase.auth.updateUser`)
- Theme toggle (light/dark, persisted in `localStorage`)
- Notification preferences (toggles only, no backend wiring yet)
- Delete account (confirmation dialog → server fn using admin client)

## 4. Admin module polish

- **Dashboard**: keep analytics; tighten layout.
- **Students** (renamed upload card to **"Student Details"**):
  - Search by name / university, status filter (Active / Inactive / Blocked).
  - Table columns: avatar, name, email, university, course, status, actions (View / Block / Remove).
  - Row click → `/admin/students/$id` full profile (name, email, uni, course, skills, projects, certificates, resume view/download/share).
- **Companies**: search by name / industry, same status pattern, row click → `/admin/companies/$id` showing description, location, contact, website, posts with applicant counts.
- **Job Posts / Internship Posts**: split sidebar entries; filter by `type`. Click row → applicants list (avatar, name, email, course, resume view/download). Click student/company → respective profile page.
- Status logic: `active` = has logged in at least once (auth `last_sign_in_at` via admin client), `inactive` = never, `blocked` = `blocked=true`.

## 5. Student module polish

- **Profile**: profile picture upload (new `avatars` storage bucket, public), required fields (name, email, university, course, year of study, graduation year) with validation message *"Please fill required fields."* Optional: bio, contact number, skills, projects (title + description only), certificates, achievements, extracurriculars, resume.
- **Jobs / Internships**: separate sidebar entries (same route, `?type=` filter). Search by company / industry. Each card: company, title, description, required skills, deadline, Apply button → application form (name, email, course, skills, resume upload, optional note) — prefilled from profile.
- **Applications**: status badges Applied / Under Review / Selected / Rejected (map existing enum).

## 6. Company module polish

- **Profile**: logo upload (existing `company-logos` bucket), required (name, email, industry, website) with validation. Optional bio/contact.
- **Job/Internship Posts**: split entries with `?type=` filter, search.
- **Applicants**: avatar, name, email, course, resume view/download; click → student profile page.

## 7. Small backend additions

- Migration: seed default admin user + role.
- Migration: create public `avatars` bucket with RLS (owner write, public read).
- Server functions:
  - `resolveLogin({ email })` — returns `{ exists, kind: 'student' | 'company' | 'admin' | null }`.
  - `createPasswordSignup({ email, password })` — signs up user, assigns role from whitelist/companies, marks whitelist row used.
  - `getStudentById(id)` / `getCompanyById(id)` — admin/company fetchers with related data.
  - `deleteOwnAccount()` — admin-deletes the calling user.
  - Update `listStudents` / `listCompanies` to include `last_sign_in_at` for status.

## 8. Tech notes (skip if not relevant)

- All new routes are file-based under `src/routes/`; sidebar uses `@/components/ui/sidebar` with `useRouterState` for active link.
- Theme toggle stores `theme` in `localStorage` and toggles `dark` class on `<html>`.
- Create-password page uses `signUp` with `emailRedirectTo: window.location.origin + '/dashboard'`; admin keeps auto-confirm off, so the create-password page tells the user to verify email.

## Out of scope (flag before doing)

- Real notification system (settings toggles only).
- Resume "share" beyond a copy-link button.
- Real-time presence beyond `last_sign_in_at` snapshots.

Reply **go** and I'll implement in this order: migrations → server functions → sidebar shell → login/create-password → settings → admin pages → student/company polish.
