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
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#43474e] font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Role-based route guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function RoleBasedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'student' | 'admin' }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile || profile.role !== requiredRole) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ===== STUDENT ROUTES ===== */}
        <Route
          path="/student"
          element={
            <RoleBasedRoute requiredRole="student">
              <Suspense fallback={<LoadingFallback />}>
                <StudentDashboard />
              </Suspense>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/student/lesson/:lessonId"
          element={
            <RoleBasedRoute requiredRole="student">
              <Suspense fallback={<LoadingFallback />}>
                <LessonViewer />
              </Suspense>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/student/settings"
          element={
            <RoleBasedRoute requiredRole="student">
              <Suspense fallback={<LoadingFallback />}>
                <AccountSettings />
              </Suspense>
            </RoleBasedRoute>
          }
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/admin"
          element={
            <RoleBasedRoute requiredRole="admin">
              <Suspense fallback={<LoadingFallback />}>
                <AdminDashboard />
              </Suspense>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/provision"
          element={
            <RoleBasedRoute requiredRole="admin">
              <Suspense fallback={<LoadingFallback />}>
                <AdminProvisioningForm />
              </Suspense>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <RoleBasedRoute requiredRole="admin">
              <Suspense fallback={<LoadingFallback />}>
                <AdminContentCreator />
              </Suspense>
            </RoleBasedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RoleBasedRoute requiredRole="admin">
              <Suspense fallback={<LoadingFallback />}>
                <AdminAuditLog />
              </Suspense>
            </RoleBasedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/login" replace />;

  const dashboardPath = profile?.role === 'admin' ? '/admin' : '/student';
  return <Navigate to={dashboardPath} replace />;
}

function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-[#002045] mb-4">Access Denied</h1>
        <p className="text-lg text-[#43474e] mb-8">You do not have permission to access this page.</p>
        <a
          href="/login"
          className="inline-block bg-[#002045] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#006b5f] transition-all duration-200"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
}
