// ============================================================================
// src/pages/student/Dashboard.tsx
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, CheckSquare } from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Entitlement } from '../../types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserCourses();
  }, [user]);

  const fetchUserCourses = async () => {
    try {
      // Fetch entitlements
      const { data: entData, error: entError } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', user?.id)
        .is('revoked_at', null);

      if (entError) throw entError;
      setEntitlements(entData || []);

      // Fetch courses (RLS will filter)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true);

      if (courseError) throw courseError;
      setCourses(courseData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium">Loading your courses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      {/* Main Content Grid: 12 columns */}
      <main className="pt-24 px-12 py-12">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold text-[#002045] mb-2 font-title-lg">My Learning Journey</h1>
            <p className="text-lg text-[#43474e]">Continue where you left off</p>
          </motion.div>

          {/* Two-column layout: Left (8 cols) content, Right (4 cols) sidebar */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Course Cards Section */}
            <div className="col-span-8">
              {/* Active Courses Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#002045] mb-6 font-title-lg">Your Courses</h2>

                {error ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 bg-[#ffdad6] border border-[#ba1a1a] rounded-xl"
                  >
                    <p className="text-[#ba1a1a]">{error}</p>
                  </motion.div>
                ) : courses.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl border border-[#c4c6cf] text-center">
                    <BookOpen size={48} className="text-[#74777f] mx-auto mb-4 opacity-50" />
                    <p className="text-[#43474e]">No courses available yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ translateY: -4 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Link to={`/student/lesson/${course.id}`} className="block">
                          <div className="bg-white rounded-xl border border-[#c4c6cf] p-6 hover:shadow-lg transition-all duration-300">
                            {/* Course Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-[#002045] mb-1 font-title-lg">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-[#43474e] line-clamp-2">{course.description}</p>
                              </div>
                              <div className="ml-4 px-3 py-1 bg-[#62fae3] text-[#007165] rounded-full text-xs font-bold uppercase tracking-wider">
                                In Progress
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="h-2 bg-[#dce9ff] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '65%' }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className="h-full bg-[#006b5f]"
                                />
                              </div>
                              <p className="text-xs text-[#74777f] mt-2">65% complete</p>
                            </div>

                            {/* Course Meta */}
                            <div className="flex items-center gap-6 text-sm text-[#43474e]">
                              <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>4 hours remaining</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckSquare size={16} />
                                <span>8 of 12 lessons</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sidebar (4 cols) */}
            <aside className="col-span-4 space-y-6">
              {/* Quick Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-[#002045] to-[#1a365d] text-white p-6 rounded-xl shadow-lg overflow-hidden relative"
              >
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-sm font-medium opacity-90 mb-4">Your Progress</h3>
                  <p className="text-4xl font-bold mb-2">65%</p>
                  <p className="text-sm opacity-80">Complete this month</p>
                </div>
              </motion.div>

              {/* Recent Activity Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-6"
              >
                <h3 className="text-lg font-semibold text-[#002045] mb-4 font-title-lg">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#006b5f] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#0b1c30]">Completed Lesson 8</p>
                      <p className="text-xs text-[#74777f]">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#006b5f] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-[#0b1c30]">Started SQL Basics</p>
                      <p className="text-xs text-[#74777f]">Yesterday</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Support Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#eff4ff] rounded-xl border border-[#c4c6cf] p-6"
              >
                <h3 className="text-lg font-semibold text-[#002045] mb-2 font-title-lg">Need Help?</h3>
                <p className="text-sm text-[#43474e] mb-4">Contact our support team for any questions.</p>
                <button className="w-full px-4 py-2 bg-[#006b5f] text-white rounded-lg text-sm font-medium hover:bg-[#005148] transition-colors">
                  Contact Support
                </button>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
