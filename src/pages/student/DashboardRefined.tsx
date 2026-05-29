import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  PlayCircle,
  BarChart3,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Bundle } from '../../types';

interface CourseWithMeta extends Course {
  firstLessonId?: string;
  totalLessons: number;
}

export default function DashboardRefined() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithMeta[]>([]);
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
        .select('course_id, bundle_id, entitlement_type')
        .eq('user_id', user!.id)
        .is('revoked_at', null);

      if (entError) throw entError;

      const courseIds = new Set<string>();
      const bundleIds = new Set<string>();

      entitlements?.forEach((ent: { course_id: string | null; bundle_id: string | null; entitlement_type: string }) => {
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

        if (coursesData && coursesData.length > 0) {
          // Fetch lessons for all courses at once
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id, course_id, lesson_order')
            .in('course_id', Array.from(courseIds))
            .eq('is_published', true)
            .order('lesson_order', { ascending: true });

          // Group lessons by course
          const lessonsByCourse: Record<string, { id: string; lesson_order: number }[]> = {};
          lessonsData?.forEach((lesson: { id: string; course_id: string; lesson_order: number }) => {
            if (!lessonsByCourse[lesson.course_id]) lessonsByCourse[lesson.course_id] = [];
            lessonsByCourse[lesson.course_id].push(lesson);
          });

          setCourses(
            coursesData.map((course: Course) => ({
              ...course,
              firstLessonId: lessonsByCourse[course.id]?.[0]?.id,
              totalLessons: lessonsByCourse[course.id]?.length ?? 0,
            }))
          );
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium text-base">Loading your courses...</p>
          </motion.div>
        </main>
      </div>
    );
  }

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
                : 'Your courses will appear here once your access is provisioned'}
            </p>
          </motion.div>
        </div>

        {/* 12-Column Grid Content */}
        <div className="mx-auto max-w-[1280px] px-12 pb-12">
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT CONTENT (8 COLS) */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-[#002045] font-title-lg flex items-center gap-2">
                  <BookOpen size={28} className="text-[#006b5f]" />
                  My Courses
                </h2>
              </div>

              {courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.map((course, idx) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      whileHover={{ translateY: -3, transition: { duration: 0.15 } }}
                      className="group bg-white border border-[#c4c6cf] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#006b5f] transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#002045] font-title-lg mb-1">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm text-[#43474e] line-clamp-2">{course.description}</p>
                            )}
                          </div>
                          <motion.div whileHover={{ scale: 1.1 }} className="flex-shrink-0 ml-4">
                            <PlayCircle
                              size={32}
                              className="text-[#006b5f] group-hover:text-[#005148] transition-colors"
                            />
                          </motion.div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-[#43474e] mb-4">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            {course.totalLessons} lesson{course.totalLessons !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* CTA */}
                        {course.firstLessonId ? (
                          <button
                            onClick={() => navigate(`/student/lesson/${course.firstLessonId}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#006b5f] text-white rounded-lg text-sm font-medium hover:bg-[#005148] transition-colors"
                          >
                            <PlayCircle size={16} />
                            Start Learning
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#f3f4f7] text-[#43474e] rounded-lg text-sm font-medium">
                            No lessons yet
                          </span>
                        )}
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
                  <p className="text-[#43474e] max-w-sm mx-auto">
                    Your courses will appear here once your administrator provisions access for you.
                  </p>
                </motion.div>
              )}

              {/* Bundles Section */}
              {bundles.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-2xl font-bold text-[#002045] font-title-lg mb-4">
                    Course Bundles
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {bundles.map((bundle, idx) => (
                      <motion.div
                        key={bundle.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                        whileHover={{ translateY: -4 }}
                        className="bg-gradient-to-br from-[#006b5f] to-[#005148] rounded-xl p-6 text-white shadow-lg"
                      >
                        <h3 className="text-lg font-semibold mb-2">{bundle.title}</h3>
                        {bundle.description && (
                          <p className="text-sm opacity-90 mb-4 line-clamp-2">{bundle.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm font-medium opacity-80">
                          Explore <ArrowRight size={16} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>

            {/* RIGHT SIDEBAR (4 COLS) */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-4 space-y-6"
            >
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-[#eff4ff] to-white border border-[#c4c6cf] rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-4 flex items-center gap-2">
                  <BarChart3 size={14} />
                  Your Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0b1c30]">Enrolled Courses</span>
                    <span className="text-2xl font-bold text-[#006b5f]">{courses.length}</span>
                  </div>
                  <div className="border-t border-[#c4c6cf] pt-4 flex items-center justify-between">
                    <span className="text-sm text-[#0b1c30]">Total Lessons</span>
                    <span className="text-2xl font-bold text-[#006b5f]">
                      {courses.reduce((sum, c) => sum + c.totalLessons, 0)}
                    </span>
                  </div>
                  {bundles.length > 0 && (
                    <div className="border-t border-[#c4c6cf] pt-4 flex items-center justify-between">
                      <span className="text-sm text-[#0b1c30]">Bundles</span>
                      <span className="text-2xl font-bold text-[#006b5f]">{bundles.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Jump to a Course */}
              {courses.length > 0 && (
                <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-4">
                    Jump Back In
                  </h3>
                  <div className="space-y-2">
                    {courses.slice(0, 3).map((course) => (
                      <button
                        key={course.id}
                        onClick={() => course.firstLessonId && navigate(`/student/lesson/${course.firstLessonId}`)}
                        disabled={!course.firstLessonId}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-[#eff4ff] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#e0f3f0] flex items-center justify-center flex-shrink-0">
                          <PlayCircle size={16} className="text-[#006b5f]" />
                        </div>
                        <span className="text-sm font-medium text-[#0b1c30] truncate group-hover:text-[#006b5f] transition-colors">
                          {course.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Link */}
              <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-3">
                  Account
                </h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#0b1c30]">{profile?.full_name}</p>
                  <p className="text-xs text-[#43474e]">{user?.email}</p>
                </div>
                <Link
                  to="/student/settings"
                  className="mt-4 inline-block text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors"
                >
                  Manage account →
                </Link>
              </div>

              {/* Support CTA */}
              <div className="bg-[#002045] rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl" />
                <h3 className="text-lg font-semibold mb-2 relative z-10">Need Help?</h3>
                <p className="text-sm opacity-80 mb-4 relative z-10">
                  Contact your administrator for access or course support.
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
