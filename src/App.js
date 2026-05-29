import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ============================================================================
// src/App.tsx
// ============================================================================
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
// Student pages
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const LessonViewer = React.lazy(() => import('./pages/student/LessonViewer'));
const AccountSettings = React.lazy(() => import('./pages/student/AccountSettings'));
// Admin pages
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminProvisioningForm = React.lazy(() => import('./pages/admin/ProvisioningForm'));
const AdminContentCreator = React.lazy(() => import('./pages/admin/ContentCreator'));
const AdminAuditLog = React.lazy(() => import('./pages/admin/AuditLog'));
// Loading fallback
function LoadingFallback() {
    return (_jsx("div", { className: "min-h-screen bg-[#f8f9ff] flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading..." })] }) }));
}
// Role-based route guard
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return _jsx(_Fragment, { children: children });
}
function RoleBasedRoute({ children, requiredRole }) {
    const { user, profile, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (!profile || profile.role !== requiredRole)
        return _jsx(Navigate, { to: "/unauthorized", replace: true });
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/unauthorized", element: _jsx(UnauthorizedPage, {}) }), _jsx(Route, { path: "/student", element: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(StudentDashboard, {}) }) }) }), _jsx(Route, { path: "/student/lesson/:lessonId", element: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(LessonViewer, {}) }) }) }), _jsx(Route, { path: "/student/settings", element: _jsx(RoleBasedRoute, { requiredRole: "student", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(AccountSettings, {}) }) }) }), _jsx(Route, { path: "/admin", element: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(AdminDashboard, {}) }) }) }), _jsx(Route, { path: "/admin/provision", element: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(AdminProvisioningForm, {}) }) }) }), _jsx(Route, { path: "/admin/content", element: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(AdminContentCreator, {}) }) }) }), _jsx(Route, { path: "/admin/audit", element: _jsx(RoleBasedRoute, { requiredRole: "admin", children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsx(AdminAuditLog, {}) }) }) }), _jsx(Route, { path: "/", element: _jsx(RootRedirect, {}) })] }) }));
}
function RootRedirect() {
    const { user, profile, loading } = useAuth();
    if (loading)
        return _jsx(LoadingFallback, {});
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    const dashboardPath = profile?.role === 'admin' ? '/admin' : '/student';
    return _jsx(Navigate, { to: dashboardPath, replace: true });
}
function UnauthorizedPage() {
    return (_jsx("div", { className: "min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("h1", { className: "text-5xl font-bold text-[#002045] mb-4", children: "Access Denied" }), _jsx("p", { className: "text-lg text-[#43474e] mb-8", children: "You do not have permission to access this page." }), _jsx("a", { href: "/login", className: "inline-block bg-[#002045] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006b5f] transition-all duration-200", children: "Return to Login" })] }) }));
}
