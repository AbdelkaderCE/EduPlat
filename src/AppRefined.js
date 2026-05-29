import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ============================================================================
// src/AppRefined.tsx
// ============================================================================
// Primary Router Layout with Role-Based Access Control
//
// Responsibilities:
//   1. Check logged-in user's profile role (student vs admin)
//   2. Route to appropriate shell (Student Canvas vs Admin Control Room)
//   3. Protect routes with authentication/authorization checks
//   4. Lazy-load page components for performance
//   5. Provide loading fallback UI during authentication state transitions
//
// Route Structure:
//   Public Routes (no auth required):
//     /login                 - Email/password authentication
//     /reset-password        - Password recovery
//
//   Student Routes (role === 'student'):
//     /student               - Dashboard with course listing
//     /student/lesson/:id    - Lesson viewer with multi-media canvas
//     /student/settings      - Account settings & profile
//
//   Admin Routes (role === 'admin'):
//     /admin                 - Admin dashboard with overview
//     /admin/provision       - Manual student provisioning form
//     /admin/content         - Content creator (courses, lessons, bundles)
//     /admin/audit           - Access audit log viewer
//
// Design System: ScholarStream specification
// ============================================================================
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { isDemoMode } from './config/supabaseClient';
// =========================================================================
// LAZY-LOADED PAGE COMPONENTS
// =========================================================================
// Public Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage'));
// Student Pages
const DashboardRefined = React.lazy(() => import('./pages/student/DashboardRefined'));
const LessonViewerRefined = React.lazy(() => import('./pages/student/LessonViewerRefined'));
const AccountSettings = React.lazy(() => import('./pages/student/AccountSettings'));
// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const ProvisioningForm = React.lazy(() => import('./pages/admin/ProvisioningForm'));
const ContentCreator = React.lazy(() => import('./pages/admin/ContentCreator'));
const AuditLog = React.lazy(() => import('./pages/admin/AuditLog'));
// =========================================================================
// LOADING FALLBACK
// =========================================================================
function LoadingFallback() {
    return (_jsx("div", { className: "min-h-screen bg-[#f8f9ff] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading..." })] }) }));
}
// =========================================================================
// UNAUTHORIZED PAGE
// =========================================================================
function UnauthorizedPage() {
    return (_jsx("div", { className: "min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("h1", { className: "text-4xl font-bold text-[#002045] mb-2 font-title-lg", children: "403" }), _jsx("h2", { className: "text-2xl font-semibold text-[#0b1c30] mb-4", children: "Unauthorized Access" }), _jsx("p", { className: "text-[#43474e] mb-8", children: "You don't have permission to access this resource. Please contact your administrator." }), _jsx("a", { href: "/student", className: "inline-block bg-[#006b5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#005148] transition-colors", children: "Go to Dashboard" })] }) }));
}
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
function RoleBasedRoute({ children, requiredRole }) {
    const { profile, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!profile || profile.role !== requiredRole) {
        return _jsx(UnauthorizedPage, {});
    }
    return _jsx(_Fragment, { children: children });
}
// =========================================================================
// ROOT REDIRECT (Auto-Route to Dashboard)
// =========================================================================
function RootRedirect() {
    const { user, profile, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (!profile)
        return _jsx(UnauthorizedPage, {});
    // Route to role-based dashboard
    if (profile.role === 'admin') {
        return _jsx(Navigate, { to: "/admin", replace: true });
    }
    return _jsx(Navigate, { to: "/student", replace: true });
}
// =========================================================================
// MAIN APP ROUTER
// =========================================================================
export default function AppRefined() {
    return (_jsx(Router, { children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/", element: _jsx(RootRedirect, {}) }), _jsx(Route, { path: "/student", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(DashboardRefined, {}) }) }) }), _jsx(Route, { path: "/student/lesson/:lessonId", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(LessonViewerRefined, {}) }) }) }), _jsx(Route, { path: "/student/settings", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(AccountSettings, {}) }) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(AdminDashboard, {}) }) }) }), _jsx(Route, { path: "/admin/provision", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(ProvisioningForm, {}) }) }) }), _jsx(Route, { path: "/admin/content", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(ContentCreator, {}) }) }) }), _jsx(Route, { path: "/admin/audit", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(AuditLog, {}) }) }) }), _jsx(Route, { path: "*", element: _jsx("div", { className: "min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("h1", { className: "text-4xl font-bold text-[#002045] mb-2 font-title-lg", children: "404" }), _jsx("h2", { className: "text-2xl font-semibold text-[#0b1c30] mb-4", children: "Page Not Found" }), _jsx("p", { className: "text-[#43474e] mb-8", children: "The page you're looking for doesn't exist." }), _jsx("a", { href: "/", className: "inline-block bg-[#006b5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#005148] transition-colors", children: "Go Home" })] }) }) })] }) }) }));
}
