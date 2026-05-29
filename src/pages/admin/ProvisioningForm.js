import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// ============================================================================
// src/pages/admin/ProvisioningForm.tsx
// ============================================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function ProvisioningForm() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        paymentReference: '',
        contentType: 'single_course',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [courses, setCourses] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    React.useEffect(() => {
        fetchContent();
    }, []);
    const fetchContent = async () => {
        try {
            const [coursesRes, bundlesRes] = await Promise.all([
                supabase.from('courses').select('id, title'),
                supabase.from('bundles').select('id, title'),
            ]);
            if (coursesRes.data)
                setCourses(coursesRes.data);
            if (bundlesRes.data)
                setBundles(bundlesRes.data);
        }
        catch (err) {
            console.error('Failed to fetch content:', err);
        }
        finally {
            setLoadingContent(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
    };
    const validateForm = () => {
        if (!formData.fullName.trim()) {
            setError('Full name is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.paymentReference.trim()) {
            setError('Payment reference is required');
            return false;
        }
        if (formData.contentType === 'single_course' &&
            !formData.courseId) {
            setError('Please select a course');
            return false;
        }
        if (formData.contentType === 'bundle' && !formData.bundleId) {
            setError('Please select a bundle');
            return false;
        }
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            // Call the RPC function to provision entitlement
            const { error: rpcError } = await supabase.rpc('web_provision_student', {
                p_student_email: formData.email,
                p_student_full_name: formData.fullName,
                p_order_id: formData.paymentReference,
                p_entitlement_type: formData.contentType === 'all_access' ? 'all_access' : 'explicit',
                p_course_id: formData.contentType === 'single_course'
                    ? formData.courseId
                    : null,
                p_bundle_id: formData.contentType === 'bundle' ? formData.bundleId : null,
                p_granted_by: user?.id || null,
            });
            if (rpcError)
                throw rpcError;
            setSuccessMessage(`Successfully provisioned access for ${formData.fullName}!`);
            // Reset form
            setFormData({
                fullName: '',
                email: '',
                paymentReference: '',
                contentType: 'single_course',
            });
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to provision access');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24", children: _jsxs("div", { className: "px-12 py-8 max-w-[1280px] mx-auto", children: [_jsxs(motion.button, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, onClick: () => navigate('/admin'), className: "flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors mb-6", children: [_jsx(ArrowLeft, { size: 20 }), _jsx("span", { className: "font-medium", children: "Back to Dashboard" })] }), _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsxs("div", { className: "col-span-8", children: [_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-[#002045] font-title-lg", children: "Provision Student Access" }), _jsx("p", { className: "text-[#43474e] mt-2", children: "Manually grant course or bundle access to a student" })] }), error && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6", children: [_jsx(AlertCircle, { size: 20, className: "text-red-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-red-800", children: error })] })), successMessage && (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6", children: [_jsx(CheckCircle, { size: 20, className: "text-emerald-600 flex-shrink-0" }), _jsx("p", { className: "text-sm font-medium text-emerald-800", children: successMessage })] })), _jsxs(motion.form, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, onSubmit: handleSubmit, className: "bg-white rounded-xl border border-[#c4c6cf] p-8 space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "fullName", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Full Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "fullName", name: "fullName", value: formData.fullName, onChange: handleInputChange, placeholder: "e.g., John Doe", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "email", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Email Address ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, placeholder: "john@example.com", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "paymentReference", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Payment Reference ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "text", id: "paymentReference", name: "paymentReference", value: formData.paymentReference, onChange: handleInputChange, placeholder: "e.g., ORD-2024-001", className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors" }), _jsx("p", { className: "text-xs text-[#43474e] mt-1", children: "This links the provisioning to an external order/payment" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "contentType", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Access Type ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { id: "contentType", name: "contentType", value: formData.contentType, onChange: handleInputChange, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors", children: [_jsx("option", { value: "single_course", children: "Single Course" }), _jsx("option", { value: "bundle", children: "Course Bundle" }), _jsx("option", { value: "all_access", children: "All Access" })] })] }), formData.contentType === 'single_course' && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, transition: { duration: 0.3 }, children: [_jsxs("label", { htmlFor: "courseId", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Select Course ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { id: "courseId", name: "courseId", value: formData.courseId || '', onChange: handleInputChange, disabled: loadingContent, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors disabled:bg-[#f3f4f7] disabled:cursor-not-allowed", children: [_jsx("option", { value: "", children: loadingContent ? 'Loading courses...' : 'Choose a course' }), courses.map((course) => (_jsx("option", { value: course.id, children: course.title }, course.id)))] })] })), formData.contentType === 'bundle' && (_jsxs(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, transition: { duration: 0.3 }, children: [_jsxs("label", { htmlFor: "bundleId", className: "block text-sm font-semibold text-[#002045] mb-2", children: ["Select Bundle ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("select", { id: "bundleId", name: "bundleId", value: formData.bundleId || '', onChange: handleInputChange, disabled: loadingContent, className: "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors disabled:bg-[#f3f4f7] disabled:cursor-not-allowed", children: [_jsx("option", { value: "", children: loadingContent ? 'Loading bundles...' : 'Choose a bundle' }), bundles.map((bundle) => (_jsx("option", { value: bundle.id, children: bundle.title }, bundle.id)))] })] })), formData.contentType === 'all_access' && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, transition: { duration: 0.3 }, className: "p-4 bg-[#eff4ff] border border-[#006b5f] rounded-lg", children: _jsx("p", { className: "text-sm text-[#002045] font-medium", children: "This student will have access to all courses and bundles." }) })), _jsx("div", { className: "pt-4 border-t border-[#c4c6cf]", children: _jsx(Button, { variant: "primary", size: "lg", type: "submit", disabled: loading, className: "w-full", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), "Provisioning..."] })) : ('Grant Access') }) })] })] }), _jsx("aside", { className: "col-span-4", children: _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-6 sticky top-24", children: [_jsx("h3", { className: "text-lg font-bold text-[#002045] mb-4 font-title-lg", children: "About Provisioning" }), _jsxs("div", { className: "space-y-4 text-sm text-[#43474e]", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-[#002045] mb-1", children: "What is provisioning?" }), _jsx("p", { children: "Provisioning creates a new student account and grants access to selected courses or bundles in a single atomic transaction." })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-[#002045] mb-1", children: "Payment Reference" }), _jsx("p", { children: "Link this provisioning to an external order ID or payment reference for reconciliation and auditing." })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-[#002045] mb-1", children: "Access Types" }), _jsxs("ul", { className: "list-disc list-inside space-y-1", children: [_jsxs("li", { children: [_jsx("strong", { children: "Single Course:" }), " Access to one specific course"] }), _jsxs("li", { children: [_jsx("strong", { children: "Bundle:" }), " Access to all courses in a bundle"] }), _jsxs("li", { children: [_jsx("strong", { children: "All Access:" }), " Complete platform access"] })] })] })] })] }) })] })] }) })] }));
}
