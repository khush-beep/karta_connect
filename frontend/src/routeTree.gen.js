/* eslint-disable */
// Static route tree - manually maintained, do not run TanStackRouterVite plugin

import { Route as rootRouteImport } from "./routes/__root";
import { Route as SignupRouteImport } from "./routes/signup";
import { Route as ResetPasswordRouteImport } from "./routes/reset-password";
import { Route as LoginRouteImport } from "./routes/login";
import { Route as ForgotPasswordRouteImport } from "./routes/forgot-password";
import { Route as CreatePasswordRouteImport } from "./routes/create-password";
import { Route as AuthenticatedRouteImport } from "./routes/_authenticated";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as AuthenticatedSettingsRouteImport } from "./routes/_authenticated.settings";
import { Route as AuthenticatedDashboardRouteImport } from "./routes/_authenticated.dashboard";
import { Route as AuthenticatedStudentsIdRouteImport } from "./routes/_authenticated.students.$id";
import { Route as AuthenticatedStudentSavedRouteImport } from "./routes/_authenticated.student.saved";
import { Route as AuthenticatedStudentProfileRouteImport } from "./routes/_authenticated.student.profile";
import { Route as AuthenticatedStudentApplicationsRouteImport } from "./routes/_authenticated.student.applications";
import { Route as AuthenticatedCompanyProfileRouteImport } from "./routes/_authenticated.company.profile";
import { Route as AuthenticatedCompanyPostsRouteImport } from "./routes/_authenticated.company.posts";
import { Route as AuthenticatedCompanyApplicationsRouteImport } from "./routes/_authenticated.company.applications";
import { Route as AuthenticatedCompanyScholarsRouteImport } from "./routes/_authenticated.company.scholars";
import { Route as AuthenticatedAdminAnalyticsRouteImport } from "./routes/_authenticated.admin.analytics";
import { Route as AuthenticatedStudentJobsIndexRouteImport } from "./routes/_authenticated.student.jobs.index";
import { Route as AuthenticatedAdminStudentsIndexRouteImport } from "./routes/_authenticated.admin.students.index";
import { Route as AuthenticatedAdminPostsIndexRouteImport } from "./routes/_authenticated.admin.posts.index";
import { Route as AuthenticatedAdminCompaniesIndexRouteImport } from "./routes/_authenticated.admin.companies.index";
import { Route as AuthenticatedAdminStudentsIdRouteImport } from "./routes/_authenticated.admin.students.$id";
import { Route as AuthenticatedAdminPostsIdRouteImport } from "./routes/_authenticated.admin.posts.$id";
import { Route as AuthenticatedAdminCompaniesIdRouteImport } from "./routes/_authenticated.admin.companies.$id";
import { Route as AuthenticatedStudentJobsIdApplyRouteImport } from "./routes/_authenticated.student.jobs.$id.apply";

const SignupRoute = SignupRouteImport.update({
  id: "/signup",
  path: "/signup",
  getParentRoute: () => rootRouteImport,
});

const ResetPasswordRoute = ResetPasswordRouteImport.update({
  id: "/reset-password",
  path: "/reset-password",
  getParentRoute: () => rootRouteImport,
});

const LoginRoute = LoginRouteImport.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => rootRouteImport,
});

const ForgotPasswordRoute = ForgotPasswordRouteImport.update({
  id: "/forgot-password",
  path: "/forgot-password",
  getParentRoute: () => rootRouteImport,
});

const CreatePasswordRoute = CreatePasswordRouteImport.update({
  id: "/create-password",
  path: "/create-password",
  getParentRoute: () => rootRouteImport,
});

const AuthenticatedRoute = AuthenticatedRouteImport.update({
  id: "/_authenticated",
  getParentRoute: () => rootRouteImport,
});

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
});

const AuthenticatedSettingsRoute = AuthenticatedSettingsRouteImport.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedDashboardRoute = AuthenticatedDashboardRouteImport.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentsIdRoute = AuthenticatedStudentsIdRouteImport.update({
  id: "/students/$id",
  path: "/students/$id",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentSavedRoute = AuthenticatedStudentSavedRouteImport.update({
  id: "/student/saved",
  path: "/student/saved",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentProfileRoute = AuthenticatedStudentProfileRouteImport.update({
  id: "/student/profile",
  path: "/student/profile",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentApplicationsRoute = AuthenticatedStudentApplicationsRouteImport.update({
  id: "/student/applications",
  path: "/student/applications",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedCompanyProfileRoute = AuthenticatedCompanyProfileRouteImport.update({
  id: "/company/profile",
  path: "/company/profile",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedCompanyPostsRoute = AuthenticatedCompanyPostsRouteImport.update({
  id: "/company/posts",
  path: "/company/posts",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedCompanyApplicationsRoute = AuthenticatedCompanyApplicationsRouteImport.update({
  id: "/company/applications",
  path: "/company/applications",
  getParentRoute: () => AuthenticatedRoute,
});
const AuthenticatedCompanyScholarsRoute = AuthenticatedCompanyScholarsRouteImport.update({
  id: "/company/scholars",
  path: "/company/scholars",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminAnalyticsRoute = AuthenticatedAdminAnalyticsRouteImport.update({
  id: "/admin/analytics",
  path: "/admin/analytics",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentJobsIndexRoute = AuthenticatedStudentJobsIndexRouteImport.update({
  id: "/student/jobs/",
  path: "/student/jobs/",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminStudentsIndexRoute = AuthenticatedAdminStudentsIndexRouteImport.update({
  id: "/admin/students/",
  path: "/admin/students/",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminPostsIndexRoute = AuthenticatedAdminPostsIndexRouteImport.update({
  id: "/admin/posts/",
  path: "/admin/posts/",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminCompaniesIndexRoute = AuthenticatedAdminCompaniesIndexRouteImport.update({
  id: "/admin/companies/",
  path: "/admin/companies/",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminStudentsIdRoute = AuthenticatedAdminStudentsIdRouteImport.update({
  id: "/admin/students/$id",
  path: "/admin/students/$id",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminPostsIdRoute = AuthenticatedAdminPostsIdRouteImport.update({
  id: "/admin/posts/$id",
  path: "/admin/posts/$id",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedAdminCompaniesIdRoute = AuthenticatedAdminCompaniesIdRouteImport.update({
  id: "/admin/companies/$id",
  path: "/admin/companies/$id",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedStudentJobsIdApplyRoute = AuthenticatedStudentJobsIdApplyRouteImport.update({
  id: "/student/jobs/$id/apply",
  path: "/student/jobs/$id/apply",
  getParentRoute: () => AuthenticatedRoute,
});

const AuthenticatedRouteChildren = {
  AuthenticatedDashboardRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedAdminAnalyticsRoute,
  AuthenticatedCompanyScholarsRoute,
  AuthenticatedCompanyApplicationsRoute,
  AuthenticatedCompanyPostsRoute,
  AuthenticatedCompanyProfileRoute,
  AuthenticatedStudentApplicationsRoute,
  AuthenticatedStudentProfileRoute,
  AuthenticatedStudentSavedRoute,
  AuthenticatedStudentsIdRoute,
  AuthenticatedAdminCompaniesIdRoute,
  AuthenticatedAdminPostsIdRoute,
  AuthenticatedAdminStudentsIdRoute,
  AuthenticatedAdminCompaniesIndexRoute,
  AuthenticatedAdminPostsIndexRoute,
  AuthenticatedAdminStudentsIndexRoute,
  AuthenticatedStudentJobsIndexRoute,
  AuthenticatedStudentJobsIdApplyRoute,
};

const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren,
);

const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  CreatePasswordRoute,
  ForgotPasswordRoute,
  LoginRoute,
  ResetPasswordRoute,
  SignupRoute,
};

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren);
