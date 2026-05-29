import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ============================================================================
// src/pages/auth/ResetPasswordPage.tsx
// ============================================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { Button } from '../../components/shared/Button';
export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState('request');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const handleRequestReset = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError)
                throw resetError;
            setSuccessMessage('Check your email for a password reset link. You should receive it within a few minutes.');
            setTimeout(() => {
                setStep('confirm');
                setSuccessMessage(null);
            }, 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send reset email');
        }
        finally {
            setLoading(false);
        }
    };
    const handleConfirmReset = async (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('Please enter the code from your email');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const { error: resetError } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: 'recovery',
            });
            if (resetError)
                throw resetError;
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError)
                throw updateError;
            setSuccessMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-[#002045] to-[#006b5f] flex items-center justify-center p-4", children: [_jsxs(Link, { to: "/login", className: "absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors", children: [_jsx(ArrowLeft, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: "Back to Login" })] }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 }, className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl p-8 md:p-10", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-[#002045] mb-2 font-title-lg", children: "Reset Password" }), _jsx("p", { className: "text-[#43474e]", children: step === 'request'
                                        ? 'Enter your email to receive a password reset link'
                                        : 'Enter the code from your email and your new password' })] }), error && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6", children: [_jsx(AlertCircle, { size: 20, className: "text-red-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-red-800", children: error })] })), successMessage && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6", children: [_jsx(CheckCircle, { size: 20, className: "text-emerald-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-emerald-800", children: successMessage })] })), step === 'request' && (_jsxs(motion.form, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, onSubmit: handleRequestReset, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Email Address" }), _jsx("input", { type: "email", id: "email", value: email, onChange: (e) => {
                                                setEmail(e.target.value);
                                                setError(null);
                                            }, placeholder: "you@example.com", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsx(Button, { variant: "primary", size: "lg", type: "submit", disabled: loading, className: "w-full", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), "Sending..."] })) : ('Send Reset Link') })] })), step === 'confirm' && (_jsxs(motion.form, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, onSubmit: handleConfirmReset, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "code", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Reset Code" }), _jsx("input", { type: "text", id: "code", value: code, onChange: (e) => {
                                                setCode(e.target.value);
                                                setError(null);
                                            }, placeholder: "Enter the code from your email", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-semibold text-[#002045] mb-2", children: "New Password" }), _jsx("input", { type: "password", id: "newPassword", value: newPassword, onChange: (e) => {
                                                setNewPassword(e.target.value);
                                                setError(null);
                                            }, placeholder: "At least 8 characters", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Confirm Password" }), _jsx("input", { type: "password", id: "confirmPassword", value: confirmPassword, onChange: (e) => {
                                                setConfirmPassword(e.target.value);
                                                setError(null);
                                            }, placeholder: "Confirm your new password", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsx(Button, { variant: "primary", size: "lg", type: "submit", disabled: loading, className: "w-full", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), "Resetting..."] })) : ('Reset Password') }), _jsx("button", { type: "button", onClick: () => {
                                        setStep('request');
                                        setCode('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setError(null);
                                    }, className: "w-full py-2 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors", children: "Use a different email" })] })), _jsx("div", { className: "my-8 border-t border-[#c4c6cf]" }), _jsxs("p", { className: "text-center text-sm text-[#43474e]", children: ["Remember your password?", ' ', _jsx(Link, { to: "/login", className: "font-semibold text-[#006b5f] hover:text-[#005148] transition-colors", children: "Back to login" })] })] }) }), _jsx(motion.div, { animate: { y: [0, 10, 0] }, transition: { duration: 4, repeat: Infinity }, className: "absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" }), _jsx(motion.div, { animate: { y: [0, -10, 0] }, transition: { duration: 5, repeat: Infinity }, className: "absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" })] }));
}
