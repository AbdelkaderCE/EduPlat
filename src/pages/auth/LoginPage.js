import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// src/pages/auth/LoginPage.tsx
// ============================================================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isDemoMode, supabase } from '../../config/supabaseClient';
import { Button } from '../../components/shared/Button';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    if (isDemoMode) {
        const demoRoleParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demoRole') : null;
        const target = demoRoleParam === 'admin' ? '/admin' : '/student';
        navigate(target, { replace: true });
        return null;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) {
                throw authError;
            }
            if (data?.user) {
                navigate('/');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#eff4ff] flex items-center justify-center px-4", children: [_jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-[#62fae3]/20 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-[#002045]/10 rounded-full blur-3xl -z-10" }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "w-full max-w-md", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#002045] mb-6", children: _jsx("span", { className: "text-white font-bold text-2xl", children: "S" }) }), _jsx("h1", { className: "text-4xl font-bold text-[#002045] mb-2 font-title-lg", children: "ScholarStream" }), _jsx("p", { className: "text-lg text-[#43474e]", children: "Premium Educational Platform" })] }), _jsx("div", { className: "bg-white rounded-2xl shadow-sm border border-[#c4c6cf] p-8 mb-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-[#0b1c30] mb-2", children: "Email Address" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, placeholder: "student@example.com", className: "w-full px-4 py-3 rounded-lg border border-[#c4c6cf] bg-[#f8f9ff] text-[#0b1c30] placeholder-[#74777f] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 transition-all duration-200" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-[#0b1c30]", children: "Password" }), _jsx(Link, { to: "/reset-password", className: "text-xs text-[#006b5f] hover:text-[#005148] transition-colors", children: "Forgot?" })] }), _jsx("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full px-4 py-3 rounded-lg border border-[#c4c6cf] bg-[#f8f9ff] text-[#0b1c30] placeholder-[#74777f] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 transition-all duration-200" })] }), error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "p-4 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg", children: _jsx("p", { className: "text-sm text-[#ba1a1a]", children: error }) })), _jsx(Button, { type: "submit", loading: loading, variant: "primary", size: "lg", className: "w-full", children: "Sign In" })] }) }), _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm text-[#43474e]", children: ["New to ScholarStream?", ' ', _jsx("span", { className: "text-[#006b5f] font-medium", children: "Contact support to get started" })] }) })] })] }));
}
