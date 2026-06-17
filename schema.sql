-- 1. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('student', 'company', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- 2. Create Student Whitelist Table
CREATE TABLE IF NOT EXISTS public.student_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    place TEXT,
    university TEXT,
    course TEXT,
    year_of_study TEXT DEFAULT '1st Year',
    graduation_year TEXT,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    location TEXT,
    university TEXT NOT NULL,
    course TEXT NOT NULL,
    year_of_study TEXT NOT NULL DEFAULT '1st Year',
    graduation_year TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}'::text[] NOT NULL,
    achievements TEXT,
    extracurriculars TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    project_url TEXT,
    resume_url TEXT,
    avatar_url TEXT,
    bio TEXT,
    blocked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_profiles
    ADD COLUMN IF NOT EXISTS github_url TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
    ADD COLUMN IF NOT EXISTS project_url TEXT;

-- 4. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    location TEXT,
    website TEXT,
    contact_email TEXT UNIQUE NOT NULL,
    contact_phone TEXT,
    logo_url TEXT,
    blocked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Job Postings Table
CREATE TABLE IF NOT EXISTS public.job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}'::text[] NOT NULL,
    location TEXT,
    type TEXT NOT NULL CHECK (type IN ('job', 'internship')),
    deadline TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'review', 'selected', 'rejected')),
    cover_note TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on public tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies (Allow Authenticated Selects)
CREATE POLICY "Allow public select for user roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated modifications for user roles" ON public.user_roles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow select whitelist for whitelisted emails" ON public.student_whitelist FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to whitelist" ON public.student_whitelist FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
);

CREATE POLICY "Allow public select for student profiles" ON public.student_profiles FOR SELECT USING (true);
CREATE POLICY "Allow update own student profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow insert own student profile" ON public.student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admin full access to student_profiles" ON public.student_profiles FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
);

CREATE POLICY "Allow public select for companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow update own company profile" ON public.companies FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Allow insert own company profile" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Allow admin full access to companies" ON public.companies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
);

CREATE POLICY "Allow public select for job posts" ON public.job_posts FOR SELECT USING (true);
CREATE POLICY "Allow full modifications for company posts" ON public.job_posts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.companies 
        WHERE id = company_id AND owner_user_id = auth.uid()
    )
);
CREATE POLICY "Allow admin full access to job_posts" ON public.job_posts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
);

CREATE POLICY "Allow public select for applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow student to submit application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Allow student/company to modify own application" ON public.applications FOR ALL USING (
    auth.uid() = student_id OR
    EXISTS (
        SELECT 1 FROM public.job_posts jp
        JOIN public.companies c ON c.id = jp.company_id
        WHERE jp.id = post_id AND c.owner_user_id = auth.uid()
    )
);
CREATE POLICY "Allow admin full access to applications" ON public.applications FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
);
