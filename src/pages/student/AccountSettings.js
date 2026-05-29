import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ============================================================================
// src/pages/student/AccountSettings.tsx
// ============================================================================
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function AccountSettings() {
    const navigate = useNavigate();
    const { user, profile, logout } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    useEffect(() => {
        if (!user)
            return;
        if (profile) {
            setFormData((prev) => ({
                ...prev,
                fullName: profile.full_name || '',
                email: user.email || '',
            }));
        }
        setLoading(false);
    }, [user, profile]);
    if (!user || !profile) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading..." }) }) })] }));
    }
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrorMessage(null);
    };
    const validateForm = () => {
        if (!formData.fullName.trim()) {
            setErrorMessage('Full name is required');
            return false;
        }
        if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
            if (!formData.currentPassword) {
                setErrorMessage('Current password is required to set a new password');
                return false;
            }
            if (formData.newPassword.length < 8) {
                setErrorMessage('New password must be at least 8 characters');
                return false;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                setErrorMessage('Passwords do not match');
                return false;
            }
        }
        return true;
    };
    const handleSaveProfile = async () => {
        if (!validateForm())
            return;
        try {
            setSaving(true);
            setErrorMessage(null);
            setSuccessMessage(null);
            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: formData.fullName })
                .eq('user_id', user.id);
            if (profileError)
                throw profileError;
            // Update password if provided
            if (formData.newPassword) {
                const { error: updateError } = await supabase.auth.updateUser({
                    password: formData.newPassword,
                });
                if (updateError)
                    throw updateError;
                setFormData((prev) => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                }));
                setShowPasswordSection(false);
            }
            setSuccessMessage(formData.newPassword ? 'Profile and password updated successfully!' : 'Profile updated successfully!');
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        }
        catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes');
        }
        finally {
            setSaving(false);
        }
    };
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        }
        catch (err) {
            setErrorMessage('Failed to logout');
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading settings..." })] }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24", children: _jsx("div", { className: "px-12 py-8 max-w-[1280px] mx-auto", children: _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsx("aside", { className: "col-span-3", children: _jsx(motion.nav, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, className: "bg-white rounded-xl border border-[#c4c6cf] overflow-hidden", children: _jsxs("ul", { className: "divide-y divide-[#c4c6cf]", children: [_jsx("li", { children: _jsx("button", { onClick: () => {
                                                        /* Current page */
                                                    }, className: "w-full px-6 py-4 text-left hover:bg-[#eff4ff] transition-colors bg-[#eff4ff] border-l-4 border-[#006b5f]", children: _jsx("span", { className: "font-medium text-[#002045]", children: "Account Settings" }) }) }), _jsx("li", { children: _jsx("button", { onClick: () => navigate('/student'), className: "w-full px-6 py-4 text-left hover:bg-[#eff4ff] transition-colors text-[#43474e]", children: _jsx("span", { className: "font-medium", children: "Back to Dashboard" }) }) })] }) }) }), _jsxs("div", { className: "col-span-9 space-y-6", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx("h1", { className: "text-3xl font-bold text-[#002045] font-title-lg", children: "Account Settings" }), _jsx("p", { className: "text-[#43474e] mt-2", children: "Manage your profile and account preferences" })] }), successMessage && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg", children: [_jsx(CheckCircle, { size: 20, className: "text-emerald-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-emerald-800", children: successMessage })] })), errorMessage && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg", children: [_jsx(AlertCircle, { size: 20, className: "text-red-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-red-800", children: errorMessage })] })), _jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-8", children: [_jsx("h2", { className: "text-xl font-bold text-[#002045] mb-6 font-title-lg", children: "Profile Information" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "fullName", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Full Name" }), _jsx("input", { type: "text", id: "fullName", name: "fullName", value: formData.fullName, onChange: handleInputChange, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors", placeholder: "Your full name" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Email Address" }), _jsx("input", { type: "email", id: "email", value: formData.email, disabled: true, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#43474e] bg-[#f3f4f7] cursor-not-allowed" }), _jsx("p", { className: "text-xs text-[#43474e] mt-1", children: "Email cannot be changed. Contact support if needed." })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "role", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Account Type" }), _jsx("input", { type: "text", id: "role", value: profile.role === 'student' ? 'Student' : 'Administrator', disabled: true, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#43474e] bg-[#f3f4f7] cursor-not-allowed" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-[#002045] mb-2", children: "Member Since" }), _jsx("p", { className: "text-[#0b1c30]", children: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A' })] })] })] }), _jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-8", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("h2", { className: "text-xl font-bold text-[#002045] font-title-lg flex items-center gap-2", children: [_jsx(Lock, { size: 24, className: "text-[#006b5f]" }), "Security"] }) }), !showPasswordSection ? (_jsx(Button, { variant: "outline", onClick: () => setShowPasswordSection(true), children: "Change Password" })) : (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, transition: { duration: 0.3 }, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "currentPassword", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Current Password" }), _jsx("input", { type: "password", id: "currentPassword", name: "currentPassword", value: formData.currentPassword, onChange: handleInputChange, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors", placeholder: "Enter your current password" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-semibold text-[#002045] mb-2", children: "New Password" }), _jsx("input", { type: "password", id: "newPassword", name: "newPassword", value: formData.newPassword, onChange: handleInputChange, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors", placeholder: "Enter a new password (min. 8 characters)" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-semibold text-[#002045] mb-2", children: "Confirm New Password" }), _jsx("input", { type: "password", id: "confirmPassword", name: "confirmPassword", value: formData.confirmPassword, onChange: handleInputChange, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors", placeholder: "Confirm your new password" })] }), _jsx("div", { className: "flex gap-3", children: _jsx(Button, { variant: "secondary", onClick: () => {
                                                                setShowPasswordSection(false);
                                                                setFormData((prev) => ({
                                                                    ...prev,
                                                                    currentPassword: '',
                                                                    newPassword: '',
                                                                    confirmPassword: '',
                                                                }));
                                                            }, children: "Cancel" }) })] }))] }), _jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.3 }, className: "bg-red-50 rounded-xl border border-red-200 p-8", children: [_jsx("h2", { className: "text-xl font-bold text-red-900 mb-6 font-title-lg", children: "Danger Zone" }), _jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-red-800", children: "Logging out will end your current session. You can log back in anytime." }), _jsx(Button, { variant: "secondary", onClick: handleLogout, children: "Logout" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.4 }, className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm text-[#43474e]", children: "Changes are automatically saved." }), _jsx(Button, { variant: "primary", size: "lg", onClick: handleSaveProfile, disabled: saving, children: saving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { size: 18 }), "Save Changes"] })) })] })] })] }) }) })] }));
}
