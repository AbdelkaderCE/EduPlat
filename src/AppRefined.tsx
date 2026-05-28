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

import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

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
const AuditLog = React.lazy(() => import('./pages/admin/AuditLog'));

// =========================================================================
// LOADING FALLBACK
// =========================================================================

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#43474e] font-medium">Loading...</p>
      </div>
    </div>
  );
}

// =========================================================================
// UNAUTHORIZED PAGE
// =========================================================================

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-[#002045] mb-2 font-title-lg">403</h1>
        <h2 className="text-2xl font-semibold text-[#0b1c30] mb-4">Unauthorized Access</h2>
        <p className="text-[#43474e] mb-8">
          You don't have permission to access this resource. Please contact your administrator.
        </p>
        <a
          href="/student"
          className="inline-block bg-[#006b5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#005148] transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

// =========================================================================
// PROTECTED ROUTE GUARD (Authentication)
// =========================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// =========================================================================
// ROLE-BASED ROUTE GUARD
// =========================================================================

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRole: 'student' | 'admin';
}

function RoleBasedRoute({ children, requiredRole }: RoleBasedRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!profile || profile.role !== requiredRole) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}

// =========================================================================
// ROOT REDIRECT (Auto-Route to Dashboard)
// =========================================================================

function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingFallback />;

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <LoadingFallback />;

  // Route to role-based dashboard
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/student" replace />;
}

// =========================================================================
// MAIN APP ROUTER
// =========================================================================

export default function AppRefined() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ================================================================
              PUBLIC ROUTES (No Authentication Required)
              ================================================================ */}

          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ================================================================
              ROOT REDIRECT (Auto-Routes to Dashboard)
              ================================================================ */}

          <Route path="/" element={<RootRedirect />} />

          {/* ================================================================
              STUDENT ROUTES (role === 'student')
              ================================================================ */}

          <Route
            path="/student"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="student">
                  <DashboardRefined />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="student">
                  <LessonViewerRefined />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/settings"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="student">
                  <AccountSettings />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          {/* ================================================================
              ADMIN ROUTES (role === 'admin')
              ================================================================ */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="admin">
                  <AdminDashboard />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/provision"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="admin">
                  <ProvisioningForm />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute>
                <RoleBasedRoute requiredRole="admin">
                  <AuditLog />
                </RoleBasedRoute>
              </ProtectedRoute>
            }
          />

          {/* ================================================================
              CATCH-ALL: 404 Not Found
              ================================================================ */}

          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                  <h1 className="text-4xl font-bold text-[#002045] mb-2 font-title-lg">404</h1>
                  <h2 className="text-2xl font-semibold text-[#0b1c30] mb-4">Page Not Found</h2>
                  <p className="text-[#43474e] mb-8">
                    The page you're looking for doesn't exist.
                  </p>
                  <a
                    href="/"
                    className="inline-block bg-[#006b5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#005148] transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}
