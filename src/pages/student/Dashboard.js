import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// src/pages/student/Dashboard.tsx
// ============================================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, CheckSquare } from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function StudentDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [entitlements, setEntitlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user)
            return;
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
            if (entError)
                throw entError;
            setEntitlements(entData || []);
            // Fetch courses (RLS will filter)
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('is_published', true);
            if (courseError)
                throw courseError;
            setCourses(courseData || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load courses');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading your courses..." })] }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24 px-12 py-12", children: _jsxs("div", { className: "max-w-[1280px] mx-auto", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-12", children: [_jsx("h1", { className: "text-5xl font-bold text-[#002045] mb-2 font-title-lg", children: "My Learning Journey" }), _jsx("p", { className: "text-lg text-[#43474e]", children: "Continue where you left off" })] }), _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsx("div", { className: "col-span-8", children: _jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-[#002045] mb-6 font-title-lg", children: "Your Courses" }), error ? (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "p-6 bg-[#ffdad6] border border-[#ba1a1a] rounded-xl", children: _jsx("p", { className: "text-[#ba1a1a]", children: error }) })) : courses.length === 0 ? (_jsxs("div", { className: "p-8 bg-white rounded-xl border border-[#c4c6cf] text-center", children: [_jsx(BookOpen, { size: 48, className: "text-[#74777f] mx-auto mb-4 opacity-50" }), _jsx("p", { className: "text-[#43474e]", children: "No courses available yet" })] })) : (_jsx("div", { className: "space-y-4", children: courses.map((course) => (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, whileHover: { translateY: -4 }, transition: { duration: 0.3 }, children: _jsx(Link, { to: `/student/lesson/${course.id}`, className: "block", children: _jsxs("div", { className: "bg-white rounded-xl border border-[#c4c6cf] p-6 hover:shadow-lg transition-all duration-300", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-xl font-semibold text-[#002045] mb-1 font-title-lg", children: course.title }), _jsx("p", { className: "text-sm text-[#43474e] line-clamp-2", children: course.description })] }), _jsx("div", { className: "ml-4 px-3 py-1 bg-[#62fae3] text-[#007165] rounded-full text-xs font-bold uppercase tracking-wider", children: "In Progress" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "h-2 bg-[#dce9ff] rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: '65%' }, transition: { duration: 1, ease: 'easeOut' }, className: "h-full bg-[#006b5f]" }) }), _jsx("p", { className: "text-xs text-[#74777f] mt-2", children: "65% complete" })] }), _jsxs("div", { className: "flex items-center gap-6 text-sm text-[#43474e]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { size: 16 }), _jsx("span", { children: "4 hours remaining" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckSquare, { size: 16 }), _jsx("span", { children: "8 of 12 lessons" })] })] })] }) }) }, course.id))) }))] }) }), _jsxs("aside", { className: "col-span-4 space-y-6", children: [_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "bg-gradient-to-br from-[#002045] to-[#1a365d] text-white p-6 rounded-xl shadow-lg overflow-hidden relative", children: [_jsx("div", { className: "absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl" }), _jsxs("div", { className: "relative z-10", children: [_jsx("h3", { className: "text-sm font-medium opacity-90 mb-4", children: "Your Progress" }), _jsx("p", { className: "text-4xl font-bold mb-2", children: "65%" }), _jsx("p", { className: "text-sm opacity-80", children: "Complete this month" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-4 font-title-lg", children: "Recent Activity" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#006b5f] mt-2 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#0b1c30]", children: "Completed Lesson 8" }), _jsx("p", { className: "text-xs text-[#74777f]", children: "2 hours ago" })] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#006b5f] mt-2 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#0b1c30]", children: "Started SQL Basics" }), _jsx("p", { className: "text-xs text-[#74777f]", children: "Yesterday" })] })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.3 }, className: "bg-[#eff4ff] rounded-xl border border-[#c4c6cf] p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-2 font-title-lg", children: "Need Help?" }), _jsx("p", { className: "text-sm text-[#43474e] mb-4", children: "Contact our support team for any questions." }), _jsx("button", { className: "w-full px-4 py-2 bg-[#006b5f] text-white rounded-lg text-sm font-medium hover:bg-[#005148] transition-colors", children: "Contact Support" })] })] })] })] }) })] }));
}
