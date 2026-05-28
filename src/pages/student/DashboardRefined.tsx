// ============================================================================
// src/pages/student/DashboardRefined.tsx
// ============================================================================
// Student Overview - 12-Column Swiss Grid Layout
//
// Layout Structure:
//   Main Grid: 12 columns with 24px gaps
//   Left Content (8 cols):  Course/Bundle cards with progress tracking
//   Right Sidebar (4 cols): Stats, recent activity, support CTA
//
// Features:
//   - RLS-filtered course list (only entitled courses visible)
//   - Progress bars with animated transitions
//   - Card hover animations (translate + shadow)
//   - ScholarStream design tokens and typography
//
// Design System: ScholarStream specification
//   - Typography: Hanken Grotesk (titles), Inter (body)
//   - Colors: #002045 (navy), #006b5f (teal), #62fae3 (mint), #f8f9ff (bg)
//   - Spacing: 12-column grid, 24px gaps, 48px desktop margins
//   - Borders: 12px rounded (cards), 8px rounded (buttons)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  BarChart3,
  ArrowRight,
  Loader2,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Bundle } from '../../types';

interface CourseWithProgress extends Course {
  progress?: number;
  lessonsCompleted?: number;
  totalLessons?: number;
}

export default function DashboardRefined() {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    fetchDashboardData();
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user entitlements (RLS filtered)
      const { data: entitlements, error: entError } = await supabase
        .from('entitlements')
        .select('course_id, bundle_id')
        .eq('user_id', user!.id)
        .is('revoked_at', null);

      if (entError) throw entError;

      // Collect unique course IDs from entitlements
      const courseIds = new Set<string>();
      const bundleIds = new Set<string>();

      entitlements?.forEach((ent) => {
        if (ent.course_id) courseIds.add(ent.course_id);
        if (ent.bundle_id) bundleIds.add(ent.bundle_id);
      });

      // Fetch courses
      if (courseIds.size > 0) {
        const { data: coursesData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .in('id', Array.from(courseIds));

        if (courseError) throw courseError;

        setCourses(
          (coursesData as CourseWithProgress[]).map((course) => ({
            ...course,
            progress: Math.floor(Math.random() * 100), // Mock progress
            lessonsCompleted: Math.floor(Math.random() * 10),
            totalLessons: 12,
          }))
        );
      }

      // Fetch bundles
      if (bundleIds.size > 0) {
        const { data: bundlesData, error: bundleError } = await supabase
          .from('bundles')
          .select('*')
          .in('id', Array.from(bundleIds));

        if (bundleError) throw bundleError;
        setBundles((bundlesData as Bundle[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium text-base">Loading your courses...</p>
          </motion.div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // ERROR STATE
  // =========================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md px-4"
          >
            <AlertCircle className="w-16 h-16 text-[#ba1a1a] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#002045] mb-2">Error Loading Dashboard</h1>
            <p className="text-[#43474e] mb-6">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MAIN RENDER: 12-Column Layout
  // =========================================================================

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-16">
        {/* Header Section */}
        <div className="mx-auto max-w-[1280px] px-12 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-[#002045] font-title-lg">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-[#43474e] mt-2">
              {courses.length > 0
                ? `You have access to ${courses.length} course${courses.length !== 1 ? 's' : ''}`
                : 'Start learning with your first course'}
            </p>
          </motion.div>
        </div>

        {/* 12-Column Grid Content */}
        <div className="mx-auto max-w-[1280px] px-12 pb-12">
          <div className="grid grid-cols-12 gap-6">
            {/* ================================================================
                LEFT CONTENT (8 COLS): Courses
                ================================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-8 space-y-6"
            >
              {/* Courses Title */}
              <div>
                <h2 className="text-2xl font-bold text-[#002045] font-title-lg flex items-center gap-2">
                  <BookOpen size={28} className="text-[#006b5f]" />
                  My Courses
                </h2>
              </div>

              {/* Courses Grid */}
              {courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                      whileHover={{ translateY: -4, transition: { duration: 0.2 } }}
                      className="group bg-white border border-[#c4c6cf] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => {
                        // Navigate to first lesson of course
                      }}
                    >
                      {/* Course Card Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#002045] font-title-lg mb-1">
                              {course.title}
                            </h3>
                            <p className="text-sm text-[#43474e]">{course.description}</p>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex-shrink-0 ml-4"
                          >
                            <PlayCircle
                              size={32}
                              className="text-[#006b5f] group-hover:text-[#62fae3] transition-colors"
                            />
                          </motion.div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-[#43474e]">
                              Progress
                            </span>
                            <span className="text-sm font-semibold text-[#006b5f]">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-[#c4c6cf] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full bg-[#006b5f]"
                            />
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-[#43474e]">
                          {course.totalLessons && (
                            <span className="flex items-center gap-1">
                              <BookOpen size={14} />
                              {course.lessonsCompleted}/{course.totalLessons} lessons
                            </span>
                          )}
                          {course.duration_hours && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {course.duration_hours} hours
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-12 text-center"
                >
                  <BookOpen size={48} className="text-[#c4c6cf] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#002045] mb-2">No courses yet</h3>
                  <p className="text-[#43474e]">Your courses will appear here once you enroll.</p>
                </motion.div>
              )}

              {/* Bundles Section */}
              {bundles.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-[#002045] font-title-lg mb-4">
                    Course Bundles
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {bundles.map((bundle, idx) => (
                      <motion.div
                        key={bundle.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + idx * 0.05 }}
                        whileHover={{ translateY: -4 }}
                        className="bg-gradient-to-br from-[#006b5f] to-[#005148] rounded-xl p-6 text-white shadow-lg"
                      >
                        <h3 className="text-lg font-semibold mb-2">{bundle.title}</h3>
                        <p className="text-sm opacity-90 mb-4">{bundle.description}</p>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          Explore <ArrowRight size={16} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>

            {/* ================================================================
                RIGHT SIDEBAR (4 COLS): Stats and Quick Actions
                ================================================================ */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-4 space-y-6"
            >
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-[#eff4ff] to-white border border-[#c4c6cf] rounded-xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#43474e] mb-4">
                  Your Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0b1c30]">Total Courses</span>
                    <span className="text-2xl font-bold text-[#006b5f]">{courses.length}</span>
                  </div>
                  <div className="border-t border-[#c4c6cf] pt-4 flex items-center justify-between">
                    <span className="text-sm text-[#0b1c30]">Average Progress</span>
                    <span className="text-2xl font-bold text-[#006b5f]">
                      {courses.length > 0
                        ? Math.round(
                            courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#43474e] mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 pb-3 border-b border-[#c4c6cf] last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center flex-shrink-0">
                        <PlayCircle size={16} className="text-[#006b5f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0b1c30] truncate">
                          Lesson {item} completed
                        </p>
                        <p className="text-xs text-[#43474e]">2 days ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support CTA */}
              <div className="bg-[#002045] rounded-xl p-6 text-white relative overflow-hidden">
                {/* Subtle accent glow */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl" />

                <h3 className="text-lg font-semibold mb-2 relative z-10">Need Help?</h3>
                <p className="text-sm opacity-90 mb-4 relative z-10">
                  Contact our support team for assistance with your courses.
                </p>
                <button className="w-full bg-[#62fae3] text-[#007165] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors duration-200 relative z-10">
                  Get Support
                </button>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}
