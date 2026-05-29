import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// src/components/Header.tsx
// ============================================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
export function Header() {
    const { user, profile, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const handleLogout = async () => {
        await logout();
    };
    return (_jsx("header", { className: "fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#c4c6cf] shadow-sm h-16", children: _jsxs("div", { className: "max-w-[1280px] mx-auto px-12 h-full flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-[#002045] flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-lg", children: "S" }) }), _jsx("span", { className: "text-[#002045] font-bold text-lg font-title-lg", children: "ScholarStream" })] }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "relative p-2 hover:bg-[#eff4ff] rounded-lg transition-colors", children: [_jsx(Bell, { size: 20, className: "text-[#43474e]" }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full" })] }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "p-2 hover:bg-[#eff4ff] rounded-lg transition-colors", children: _jsx(ShoppingCart, { size: 20, className: "text-[#43474e]" }) }), _jsxs("div", { className: "relative", children: [_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => setDropdownOpen(!dropdownOpen), className: "w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center border border-[#c4c6cf] hover:border-[#006b5f] transition-colors", children: _jsx(User, { size: 20, className: "text-[#002045]" }) }), dropdownOpen && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, className: "absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#c4c6cf] overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-[#c4c6cf]", children: [_jsx("p", { className: "text-sm font-medium text-[#0b1c30]", children: profile?.full_name }), _jsx("p", { className: "text-xs text-[#43474e]", children: user?.email })] }), _jsx(Link, { to: profile?.role === 'admin' ? '/admin' : '/student/settings', className: "block px-4 py-2 text-sm text-[#0b1c30] hover:bg-[#eff4ff] transition-colors", onClick: () => setDropdownOpen(false), children: "Settings" }), _jsxs("button", { onClick: () => {
                                                setDropdownOpen(false);
                                                handleLogout();
                                            }, className: "w-full text-left px-4 py-2 text-sm text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors flex items-center gap-2", children: [_jsx(LogOut, { size: 16 }), "Logout"] })] }))] })] })] }) }));
}
