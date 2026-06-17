# Karta Connect - Access Control & Security Implementation

## Overview
This document outlines the multi-layer security implementation for Karta Connect's Scholar/Organization/Admin access control system.

---

## 🔐 Security Layers

### Layer 1: Authentication
- **JWT Token**: Issued by Supabase Auth on login
- **Token Persistence**: Supabase client handles automatic session persistence
- **Token Refresh**: Automatic refresh on expiration via Supabase SDK

**Files**:
- `frontend/src/integrations/supabase/client.js` - Supabase client setup
- `frontend/src/hooks/use-auth.js` - Auth state management

---

### Layer 2: Frontend Route Protection
All role-specific routes enforce role-based access via `beforeLoad` guards.

#### Admin Routes (Protected)
- `/admin/analytics` - Analytics dashboard
- `/admin/companies` - Manage companies
- `/admin/companies/:id` - Company details
- `/admin/posts` - Manage all job posts
- `/admin/posts/:id` - Job post details
- `/admin/students` - Manage students
- `/admin/students/:id` - Student details

#### Student Routes (Protected)
- `/student/profile` - Student profile
- `/student/jobs` - Browse jobs
- `/student/jobs/:id/apply` - Apply to job
- `/student/applications` - View applications
- `/student/saved` - Saved jobs

#### Company Routes (Protected)
- `/company/profile` - Company profile
- `/company/posts` - Company job posts
- `/company/applications` - View applications

**Implementation**:
```javascript
export const Route = createFileRoute("/_authenticated/admin/analytics")({
    beforeLoad: requireAdmin,  // Guards route access
    component: AdminAnalytics,
});
```

**Files**:
- `frontend/src/lib/route-guards.js` - Guard utilities
- All route files in `frontend/src/routes/`

---

### Layer 3: Backend API Authentication & Authorization

#### Authentication Middleware
Every sensitive API call requires JWT token verification via `Authorization` header.

```javascript
Authorization: Bearer <JWT_TOKEN>
```

**Implementation**:
```javascript
app.post('/api/admin/delete-student', authMiddleware, requireAdminRole, ...)
```

#### Role-Based Access Control
All sensitive endpoints enforce role requirements:

| Endpoint | Method | Requires | Purpose |
|----------|--------|----------|---------|
| `/api/admin/delete-student` | POST | Admin | Delete student account |
| `/api/account/delete` | POST | Authenticated | Self-delete account |
| `/api/company/:id` | GET | Company | Get company data (verify ownership) |
| `/api/company/:id/posts` | GET | Company | Get company's posts (verify ownership) |
| `/api/job-posts/:id` | PUT | Company | Update post (verify ownership) |
| `/api/job-posts/:id` | DELETE | Company | Delete post (verify ownership) |
| `/api/student/profile` | GET | Student | Get own profile |
| `/api/student/profile` | PUT | Student | Update own profile |
| `/api/student/applications` | GET | Student | Get own applications |
| `/api/student/applications` | POST | Student | Submit application (self-verify) |

**Files**:
- `backend/server.js` - All API endpoints with middleware

---

### Layer 4: Database Row Level Security (RLS)

#### RLS Policies by Table

**user_roles**
- `SELECT`: Public (anyone can read)
- `INSERT/UPDATE/DELETE`: Only admins or user's own role

**student_whitelist**
- `SELECT`: Public
- `INSERT/UPDATE/DELETE`: Admins only

**student_profiles**
- `SELECT`: Public (all can view student profiles)
- `INSERT/UPDATE`: User can modify own profile, admins can modify any
- `DELETE`: Admins only

**companies**
- `SELECT`: Public (all can view company profiles)
- `INSERT/UPDATE`: Company owner can modify own, admins can modify any
- `DELETE`: Admins only

**job_posts**
- `SELECT`: Public (all can view posts)
- `INSERT/UPDATE/DELETE`: Company owner can modify own, admins can modify any

**applications**
- `SELECT`: Public
- `INSERT`: Student can submit own application
- `UPDATE/DELETE`: Student who applied OR company that owns post OR admin

**Files**:
- `schema.sql` - All RLS policies defined

---

## 🛡️ Ownership Verification

### Company Ownership
Companies can only access/modify resources they own:

1. **Frontend**: `requireCompany()` guard ensures user is company role
2. **Backend**: Company ownership verified via `companies.owner_user_id`
3. **Database**: RLS policies restrict access by foreign key

```javascript
// Backend verification
const { data: company } = await supabase
  .from('companies')
  .select('owner_user_id')
  .eq('id', companyId)
  .maybeSingle();

if (company.owner_user_id !== req.user.id) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### Student Self-Access
Students can only access their own data:

1. **Frontend**: Routes don't expose student ID as parameter
2. **Backend**: Student operations use `req.user.id` from JWT
3. **Database**: RLS policies restrict by `user_id`

```javascript
// Always use authenticated user's ID, not from request body
const { data: profile } = await supabase
  .from('student_profiles')
  .select('*')
  .eq('user_id', req.user.id)  // Use JWT user, not req.body
  .maybeSingle();
```

---

## 📋 API Authentication Pattern

### Frontend API Calls
All API requests include JWT token:

```javascript
import { authenticatedFetch } from "@/lib/api-client";

const data = await authenticatedFetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ data })
});
// Automatically includes: Authorization: Bearer <TOKEN>
```

**Files**:
- `frontend/src/lib/api-client.js` - authenticatedFetch helper
- `frontend/src/lib/api/index.js` - Company & Student API methods

---

## 🔄 Permission Flow Examples

### Student Applying for Job
1. **Frontend**: `requireStudent` guard allows route access
2. **Frontend**: Call `studentAPI.submitApplication(postId, coverNote)`
3. **API**: `authMiddleware` verifies JWT token
4. **API**: `requireStudentRole` checks user is student
5. **API**: Verify student hasn't already applied
6. **API**: Insert application with `student_id = req.user.id`
7. **Database**: RLS allows insert for own applications

### Company Updating Job Post
1. **Frontend**: `requireCompany` guard allows route access
2. **Frontend**: Call `companyAPI.updatePost(postId, data)`
3. **API**: `authMiddleware` verifies JWT token
4. **API**: `requireCompanyRole` checks user is company
5. **API**: Verify company owns post via `job_posts.company_id → companies.owner_user_id`
6. **API**: Update post
7. **Database**: RLS validates company ownership

### Admin Deleting Student
1. **Frontend**: `requireAdmin` guard allows route access
2. **Frontend**: Call `deleteStudentAccount(userId, email)`
3. **API**: `authMiddleware` verifies JWT token
4. **API**: `requireAdminRole` checks user is admin
5. **API**: Delete all student data (applications, profile, role, account)
6. **Database**: RLS allows admin full access

---

## ⚠️ Security Considerations

### Best Practices Implemented
✅ JWT tokens issued by Supabase Auth (trusted provider)
✅ Tokens verified on backend before any operation
✅ User ID extracted from JWT, not from request body
✅ Role verification on every sensitive operation
✅ Ownership verification prevents unauthorized access
✅ RLS policies enforce data isolation at database level
✅ Frontend guards prevent unauthorized route access
✅ No sensitive data exposed in client-side code

### Defense in Depth
The system uses multiple overlapping security layers:
- If RLS fails → Backend authorization catches it
- If Backend fails → Frontend guards prevent access
- If Frontend fails → Backend authorization blocks it

---

## 🔒 What's Protected

### Cannot Do Without Permission
- ❌ Student accessing `/admin/*` routes
- ❌ Company accessing `/student/*` routes
- ❌ Non-owners modifying company data
- ❌ Non-owners modifying company job posts
- ❌ Admin endpoints called without admin role
- ❌ Student accessing other student's applications
- ❌ Company viewing other company's applications
- ❌ Unauthenticated API calls (missing JWT)
- ❌ Invalid JWT tokens
- ❌ Expired JWT tokens

### Cross-Cutting Security
All protected by all 4 layers:
- Database layer (RLS)
- API layer (Authentication + Authorization)
- Frontend layer (Route guards)
- Application layer (API client validation)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `schema.sql` | Database RLS policies |
| `backend/server.js` | API endpoints with auth middleware |
| `frontend/src/lib/route-guards.js` | Frontend route guards |
| `frontend/src/lib/api-client.js` | Authenticated API helper |
| `frontend/src/lib/api/index.js` | Company & Student API methods |
| `frontend/src/hooks/use-auth.js` | Auth state management |
| `frontend/src/routes/_authenticated.*.jsx` | Protected routes |

---

## 🧪 Testing Recommendations

1. **Role-Based Access**: Try accessing `/admin/*` as student → should redirect
2. **Company Ownership**: Company A tries to update Company B's post → should fail
3. **Student Self-Access**: Student A tries to view Student B's profile → should fail at API
4. **JWT Validation**: API call without token → 401 error
5. **Admin Operations**: Non-admin tries to delete student → 403 error
6. **Expired Token**: Supabase auto-refreshes → if expired, redirect to login

---

## 🚀 Future Enhancements

- [ ] Rate limiting on sensitive endpoints
- [ ] API key support for trusted integrations
- [ ] Audit logging of sensitive operations
- [ ] Two-factor authentication for admins
- [ ] IP whitelisting for admin operations
- [ ] Regular security audits
- [ ] Penetration testing

