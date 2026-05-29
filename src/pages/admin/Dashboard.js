import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// src/pages/admin/Dashboard.tsx
// ============================================================================
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, BarChart3 } from 'lucide-react';
import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
export default function AdminDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalBundles: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Mock data for demo
        setStats({
            totalUsers: 1234,
            totalCourses: 45,
            totalBundles: 12,
            totalRevenue: 125678.5,
        });
        setLoading(false);
    }, []);
    const statCards = [
        {
            label: 'Total Students',
            value: stats.totalUsers.toLocaleString(),
            icon: Users,
            color: '#006b5f',
            bgColor: '#e0f3f0',
        },
        {
            label: 'Active Courses',
            value: stats.totalCourses,
            icon: BookOpen,
            color: '#006b5f',
            bgColor: '#e0f3f0',
        },
        {
            label: 'Bundle Collections',
            value: stats.totalBundles,
            icon: FileText,
            color: '#006b5f',
            bgColor: '#e0f3f0',
        },
        {
            label: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
            icon: BarChart3,
            color: '#006b5f',
            bgColor: '#e0f3f0',
        },
    ];
    const quickActions = [
        {
            title: 'Provision Student',
            description: 'Manually grant course access to a student',
            href: '/admin/provision',
            icon: '➕',
        },
        {
            title: 'Create Content',
            description: 'Add new courses, lessons, and bundles',
            href: '/admin/content',
            icon: '📝',
        },
        {
            title: 'View Audit Log',
            description: 'Monitor user access and activity',
            href: '/admin/audit',
            icon: '📊',
        },
    ];
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading admin dashboard..." })] }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24", children: _jsxs("div", { className: "px-12 py-8 max-w-[1280px] mx-auto space-y-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-4xl font-bold text-[#002045] mb-2 font-title-lg", children: "Admin Dashboard" }), _jsx("p", { className: "text-[#43474e]", children: "Manage your educational platform, students, and content" })] }), _jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: statCards.map((card, idx) => {
                                const Icon = card.icon;
                                return (_jsxs(motion.div, { whileHover: { translateY: -4 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-medium text-[#43474e] uppercase tracking-wide", children: card.label }), _jsx("div", { style: { backgroundColor: card.bgColor }, className: "p-3 rounded-lg", children: _jsx(Icon, { size: 20, style: { color: card.color } }) })] }), _jsx("p", { className: "text-2xl font-bold text-[#002045]", children: card.value })] }, idx));
                            }) }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 }, children: [_jsx("h2", { className: "text-2xl font-bold text-[#002045] mb-6 font-title-lg", children: "Quick Actions" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: quickActions.map((action, idx) => (_jsx(Link, { to: action.href, className: "no-underline", children: _jsxs(motion.div, { whileHover: { translateY: -4 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-8 hover:border-[#006b5f] transition-colors cursor-pointer group", children: [_jsx("div", { className: "text-4xl mb-4", children: action.icon }), _jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-2 font-title-lg", children: action.title }), _jsx("p", { className: "text-[#43474e] text-sm mb-6", children: action.description }), _jsxs("div", { className: "flex items-center gap-2 text-[#006b5f] font-medium text-sm group-hover:translate-x-1 transition-transform", children: ["Go to ", _jsx("span", { children: "\u2192" })] })] }) }, idx))) })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.3 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-8", children: [_jsx("h2", { className: "text-xl font-bold text-[#002045] mb-6 font-title-lg", children: "Recent Activity" }), _jsx("div", { className: "space-y-4", children: [1, 2, 3, 4, 5].map((item) => (_jsxs("div", { className: "flex items-center justify-between py-4 border-b border-[#c4c6cf] last:border-0", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center", children: _jsx("span", { className: "text-sm font-semibold text-[#006b5f]", children: String(item).padStart(2, '0') }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-[#002045]", children: ["Activity #", item] }), _jsx("p", { className: "text-sm text-[#43474e]", children: new Date(Date.now() - item * 3600000).toLocaleString() })] })] }), _jsx("div", { className: "text-xs px-3 py-1 bg-[#62fae3]/20 text-[#006b5f] rounded-full font-medium", children: "Completed" })] }, item))) })] })] }) })] }));
}
