Karta Connect - Scholar Talent & Networking Platform
Karta Connect is a professional talent and networking portal built for Karta Scholars, partner companies, NGOs, and the Karta Team. The platform facilitates whitelisted student registration, profile customization, resume hosting, opportunity publication, and job applications.

🛠️ Technology Stack
Front-end / Core: React, TypeScript, Vite
Routing & Architecture: TanStack Start, TanStack React Router, TanStack Query
Styling: Tailwind CSS (v4), Radix UI (shadcn/ui), Lucide Icons, Tw-Animate-CSS
Backend & Database: Supabase (PostgreSQL, Supabase Auth, Supabase Storage)
Package Manager: npm (Node.js) / Bun
🚀 Getting Started
Follow these steps to set up and run the project locally.

1. Prerequisites
Ensure you have the following installed on your machine:

Node.js (v20.19+ or v22.12+ recommended by Vite)
npm (included with Node)
2. Install Dependencies
Navigate to the project directory and install the required npm packages:

bash

npm install
3. Environment Configuration
Create a .env file in the root of the project (if it doesn't already exist) and populate it with your Supabase credentials:

env

VITE_SUPABASE_PROJECT_ID="qpmawxosyicruvjxvczh"
VITE_SUPABASE_URL="https://qpmawxosyicruvjxvczh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_KEY"
# Server environment variables
SUPABASE_URL="https://qpmawxosyicruvjxvczh.supabase.co"
SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_KEY"
4. Database Setup
To set up the database tables, schemas, and policies:

Open your Supabase Dashboard for the project.
Go to the SQL Editor.
Copy the contents of the schema.sql file located in the root of this project.
Run the queries to initialize:
Tables (user_roles, student_whitelist, student_profiles, companies, job_posts, applications)
Row-Level Security (RLS) policies for secure data access.
5. Running the Application Local Development Server
Start the Vite development server:

bash

npm run dev
Once started, the application will be active at:

Local: http://localhost:5173/
📦 Project Commands
npm run dev: Starts the local development server with Hot Module Replacement (HMR).
npm run build: Compiles and builds the application for production.
npm run preview: Previews the production build locally.
npm run lint: Runs ESLint to check for code issues.
npm run format: Runs Prettier to format code.
📂 Key Directory Structure
text

├── schema.sql           # Database schema definition (tables, constraints, policies)
├── supabase/            # Supabase config files
├── src/
│   ├── components/      # Reusable UI elements (Radix wrappers) & App Layout
│   ├── hooks/           # Custom React hooks (e.g. useAuth)
│   ├── integrations/    # Supabase client helpers
│   ├── lib/
│   │   └── api/         # Server functions (auth, signup, account deletion)
│   ├── routes/          # Page views & Route definition using TanStack Router
│   ├── styles.css       # Core styling & Tailwind imports
│   ├── router.tsx       # Router configuration
│   └── start.ts         # Server entrypoint
