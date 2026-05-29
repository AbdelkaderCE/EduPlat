import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowRight, Loader2, AlertCircle, PlayCircle, } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function DashboardRefined() {
    const { user, profile } = useAuth();
    const [courses, setCourses] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user || !profile)
            return;
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
                .eq('user_id', user.id)
                .is('revoked_at', null);
            if (entError)
                throw entError;
            // Collect unique course IDs from entitlements
            const courseIds = new Set();
            const bundleIds = new Set();
            entitlements?.forEach((ent) => {
                if (ent.course_id)
                    courseIds.add(ent.course_id);
                if (ent.bundle_id)
                    bundleIds.add(ent.bundle_id);
            });
            // Fetch courses
            if (courseIds.size > 0) {
                const { data: coursesData, error: courseError } = await supabase
                    .from('courses')
                    .select('*')
                    .in('id', Array.from(courseIds));
                if (courseError)
                    throw courseError;
                setCourses(coursesData.map((course) => ({
                    ...course,
                    progress: Math.floor(Math.random() * 100), // Mock progress
                    lessonsCompleted: Math.floor(Math.random() * 10),
                    totalLessons: 12,
                })));
            }
            // Fetch bundles
            if (bundleIds.size > 0) {
                const { data: bundlesData, error: bundleError } = await supabase
                    .from('bundles')
                    .select('*')
                    .in('id', Array.from(bundleIds));
                if (bundleError)
                    throw bundleError;
                setBundles(bundlesData || []);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            console.error('Dashboard fetch error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    // =========================================================================
    // LOADING STATE
    // =========================================================================
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-16 flex items-center justify-center min-h-screen", children: _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium text-base", children: "Loading your courses..." })] }) })] }));
    }
    // =========================================================================
    // ERROR STATE
    // =========================================================================
    if (error) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-16 flex items-center justify-center min-h-screen", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "text-center max-w-md px-4", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-[#ba1a1a] mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-[#002045] mb-2", children: "Error Loading Dashboard" }), _jsx("p", { className: "text-[#43474e] mb-6", children: error }), _jsx(Button, { variant: "primary", onClick: () => window.location.reload(), children: "Try Again" })] }) })] }));
    }
    // =========================================================================
    // MAIN RENDER: 12-Column Layout
    // =========================================================================
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsxs("main", { className: "pt-16", children: [_jsx("div", { className: "mx-auto max-w-[1280px] px-12 py-8", children: _jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsxs("h1", { className: "text-4xl font-bold text-[#002045] font-title-lg", children: ["Welcome back, ", profile?.full_name?.split(' ')[0] || 'Student', "!"] }), _jsx("p", { className: "text-[#43474e] mt-2", children: courses.length > 0
                                        ? `You have access to ${courses.length} course${courses.length !== 1 ? 's' : ''}`
                                        : 'Start learning with your first course' })] }) }), _jsx("div", { className: "mx-auto max-w-[1280px] px-12 pb-12", children: _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "col-span-8 space-y-6", children: [_jsx("div", { children: _jsxs("h2", { className: "text-2xl font-bold text-[#002045] font-title-lg flex items-center gap-2", children: [_jsx(BookOpen, { size: 28, className: "text-[#006b5f]" }), "My Courses"] }) }), courses.length > 0 ? (_jsx("div", { className: "space-y-4", children: courses.map((course, idx) => (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 + idx * 0.05 }, whileHover: { translateY: -4, transition: { duration: 0.2 } }, className: "group bg-white border border-[#c4c6cf] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer", onClick: () => {
                                                    // Navigate to first lesson of course
                                                }, children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-xl font-semibold text-[#002045] font-title-lg mb-1", children: course.title }), _jsx("p", { className: "text-sm text-[#43474e]", children: course.description })] }), _jsx(motion.div, { whileHover: { scale: 1.1 }, className: "flex-shrink-0 ml-4", children: _jsx(PlayCircle, { size: 32, className: "text-[#006b5f] group-hover:text-[#62fae3] transition-colors" }) })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-medium uppercase tracking-wider text-[#43474e]", children: "Progress" }), _jsxs("span", { className: "text-sm font-semibold text-[#006b5f]", children: [course.progress, "%"] })] }), _jsx("div", { className: "h-2 bg-[#c4c6cf] rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: `${course.progress}%` }, transition: { duration: 1, delay: 0.2 }, className: "h-full bg-[#006b5f]" }) })] }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-[#43474e]", children: [course.totalLessons && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(BookOpen, { size: 14 }), course.lessonsCompleted, "/", course.totalLessons, " lessons"] })), course.duration_hours && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), course.duration_hours, " hours"] }))] })] }) }, course.id))) })) : (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "bg-white border border-[#c4c6cf] rounded-xl p-12 text-center", children: [_jsx(BookOpen, { size: 48, className: "text-[#c4c6cf] mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-2", children: "No courses yet" }), _jsx("p", { className: "text-[#43474e]", children: "Your courses will appear here once you enroll." })] })), bundles.length > 0 && (_jsxs("div", { className: "mt-12", children: [_jsx("h2", { className: "text-2xl font-bold text-[#002045] font-title-lg mb-4", children: "Course Bundles" }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: bundles.map((bundle, idx) => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 + idx * 0.05 }, whileHover: { translateY: -4 }, className: "bg-gradient-to-br from-[#006b5f] to-[#005148] rounded-xl p-6 text-white shadow-lg", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: bundle.title }), _jsx("p", { className: "text-sm opacity-90 mb-4", children: bundle.description }), _jsxs("div", { className: "flex items-center gap-1 text-sm font-medium", children: ["Explore ", _jsx(ArrowRight, { size: 16 })] })] }, bundle.id))) })] }))] }), _jsxs(motion.aside, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "col-span-4 space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-br from-[#eff4ff] to-white border border-[#c4c6cf] rounded-xl p-6", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider text-[#43474e] mb-4", children: "Your Stats" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Total Courses" }), _jsx("span", { className: "text-2xl font-bold text-[#006b5f]", children: courses.length })] }), _jsxs("div", { className: "border-t border-[#c4c6cf] pt-4 flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Average Progress" }), _jsxs("span", { className: "text-2xl font-bold text-[#006b5f]", children: [courses.length > 0
                                                                            ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length)
                                                                            : 0, "%"] })] })] })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6", children: [_jsx("h3", { className: "text-sm font-semibold uppercase tracking-wider text-[#43474e] mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: [1, 2, 3].map((item) => (_jsxs("div", { className: "flex items-center gap-3 pb-3 border-b border-[#c4c6cf] last:border-0", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center flex-shrink-0", children: _jsx(PlayCircle, { size: 16, className: "text-[#006b5f]" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm font-medium text-[#0b1c30] truncate", children: ["Lesson ", item, " completed"] }), _jsx("p", { className: "text-xs text-[#43474e]", children: "2 days ago" })] })] }, item))) })] }), _jsxs("div", { className: "bg-[#002045] rounded-xl p-6 text-white relative overflow-hidden", children: [_jsx("div", { className: "absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl" }), _jsx("h3", { className: "text-lg font-semibold mb-2 relative z-10", children: "Need Help?" }), _jsx("p", { className: "text-sm opacity-90 mb-4 relative z-10", children: "Contact our support team for assistance with your courses." }), _jsx("button", { className: "w-full bg-[#62fae3] text-[#007165] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors duration-200 relative z-10", children: "Get Support" })] })] })] }) })] })] }));
}
