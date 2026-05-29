import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// src/pages/admin/AuditLog.tsx
// ============================================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Search, Filter, ChevronDown, ChevronUp, Info, Clock, Shield, Activity } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function AuditLog() {
    const navigate = useNavigate();
    const { profile: adminProfile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [mappedLogs, setMappedLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters
    const [filterAction, setFilterAction] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // UI States
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    useEffect(() => {
        fetchLogs();
    }, []);
    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch all access_audit rows sorted by creation date
            const { data: auditData, error: auditError } = await supabase
                .from('access_audit')
                .select('*')
                .order('created_at', { ascending: false });
            if (auditError)
                throw auditError;
            const rawLogs = (auditData || []);
            setLogs(rawLogs);
            // Fetch user profile information to display names/emails instead of raw UUIDs
            const uniqueUserIds = Array.from(new Set(rawLogs
                .flatMap((log) => [log.actor_user_id, log.target_user_id])
                .filter((id) => !!id)));
            let profilesMap = {};
            if (uniqueUserIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('user_id, email, full_name')
                    .in('user_id', uniqueUserIds);
                if (profilesError) {
                    console.warn('Failed to fetch user profiles for mapping:', profilesError);
                }
                else if (profilesData) {
                    profilesData.forEach((prof) => {
                        profilesMap[prof.user_id] = {
                            email: prof.email,
                            full_name: prof.full_name
                        };
                    });
                }
            }
            // Map profiles onto logs
            const mapped = rawLogs.map((log) => ({
                ...log,
                actorProfile: log.actor_user_id ? profilesMap[log.actor_user_id] : undefined,
                targetProfile: log.target_user_id ? profilesMap[log.target_user_id] : undefined
            }));
            setMappedLogs(mapped);
        }
        catch (err) {
            console.error('Error fetching audit logs:', err);
            setError(err instanceof Error ? err.message : 'An error occurred while loading audit logs');
        }
        finally {
            setLoading(false);
        }
    };
    // Get list of unique action types for filter dropdown
    const actionTypes = Array.from(new Set(logs.map((log) => log.action_type)));
    // Filter logs logic
    const filteredLogs = mappedLogs.filter((log) => {
        // 1. Action Type Filter
        if (filterAction !== 'all' && log.action_type !== filterAction) {
            return false;
        }
        // 2. Search query (matches email, name, IP, resource ID)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const targetEmail = log.targetProfile?.email?.toLowerCase() || '';
            const targetName = log.targetProfile?.full_name?.toLowerCase() || '';
            const actorEmail = log.actorProfile?.email?.toLowerCase() || '';
            const actorName = log.actorProfile?.full_name?.toLowerCase() || '';
            const ip = log.ip_address || '';
            const resourceId = log.resource_id || '';
            const action = log.action_type.toLowerCase();
            if (!targetEmail.includes(q) &&
                !targetName.includes(q) &&
                !actorEmail.includes(q) &&
                !actorName.includes(q) &&
                !ip.includes(q) &&
                !resourceId.includes(q) &&
                !action.includes(q)) {
                return false;
            }
        }
        // 3. Start Date Filter
        if (startDate) {
            const logDate = new Date(log.created_at);
            const filterStart = new Date(startDate);
            filterStart.setHours(0, 0, 0, 0);
            if (logDate < filterStart)
                return false;
        }
        // 4. End Date Filter
        if (endDate) {
            const logDate = new Date(log.created_at);
            const filterEnd = new Date(endDate);
            filterEnd.setHours(23, 59, 59, 999);
            if (logDate > filterEnd)
                return false;
        }
        return true;
    });
    // Pagination calculation
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [filterAction, searchQuery, startDate, endDate]);
    // Export to CSV
    const handleExportCSV = () => {
        if (filteredLogs.length === 0)
            return;
        // CSV Headers
        const headers = [
            'Timestamp',
            'Action Type',
            'Target User Name',
            'Target User Email',
            'Actor User Email',
            'Resource Type',
            'Resource ID',
            'IP Address',
            'User Agent',
            'Payload Details'
        ];
        // CSV Rows
        const rows = filteredLogs.map((log) => {
            const timestamp = new Date(log.created_at).toISOString();
            const action = log.action_type;
            const targetName = log.targetProfile?.full_name || '';
            const targetEmail = log.targetProfile?.email || '';
            const actorEmail = log.actorProfile?.email || 'System';
            const resourceType = log.resource_type || '';
            const resourceId = log.resource_id || '';
            const ip = log.ip_address || '';
            const ua = log.user_agent ? `"${log.user_agent.replace(/"/g, '""')}"` : '';
            const payload = `"${JSON.stringify(log.payload).replace(/"/g, '""')}"`;
            return [
                timestamp,
                action,
                targetName,
                targetEmail,
                actorEmail,
                resourceType,
                resourceId,
                ip,
                ua,
                payload
            ];
        });
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `EduPlat_AuditLog_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const getActionBadgeColor = (action) => {
        switch (action) {
            case 'entitlement_granted':
                return 'bg-[#e0f3f0] text-[#007165] border border-[#006b5f]/20';
            case 'lesson_playback_requested':
                return 'bg-[#eff4ff] text-[#002045] border border-[#dce9ff]';
            case 'entitlement_revoked':
                return 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/20';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };
    const formatActionName = (action) => {
        return action
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24 pb-12", children: _jsxs("div", { className: "px-12 py-8 max-w-[1280px] mx-auto space-y-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(motion.button, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, onClick: () => navigate('/admin'), className: "flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors mb-2 font-medium", children: [_jsx(ArrowLeft, { size: 18 }), _jsx("span", { children: "Back to Dashboard" })] }), _jsx("h1", { className: "text-4xl font-bold text-[#002045] font-title-lg tracking-tight", children: "Access Audit Logs" }), _jsx("p", { className: "text-[#43474e]", children: "Monitor all platform authorization events, content access, and user provisioning history." })] }), _jsxs(Button, { variant: "primary", onClick: handleExportCSV, disabled: filteredLogs.length === 0 || loading, className: "flex items-center gap-2", children: [_jsx(Download, { size: 18 }), _jsx("span", { children: "Export CSV" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1", children: "Total Logs" }), _jsx("p", { className: "text-2xl font-bold text-[#002045]", children: logs.length })] }), _jsx("div", { className: "bg-[#eff4ff] p-3 rounded-lg text-[#002045]", children: _jsx(Activity, { size: 20 }) })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1", children: "Filtered" }), _jsx("p", { className: "text-2xl font-bold text-[#006b5f]", children: filteredLogs.length })] }), _jsx("div", { className: "bg-[#e0f3f0] p-3 rounded-lg text-[#006b5f]", children: _jsx(Filter, { size: 20 }) })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1", children: "Provisioning" }), _jsx("p", { className: "text-2xl font-bold text-[#007165]", children: logs.filter(l => l.action_type === 'entitlement_granted').length })] }), _jsx("div", { className: "bg-[#e0f3f0] p-3 rounded-lg text-[#007165]", children: _jsx(Shield, { size: 20 }) })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1", children: "Video Plays" }), _jsx("p", { className: "text-2xl font-bold text-[#002045]", children: logs.filter(l => l.action_type === 'lesson_playback_requested').length })] }), _jsx("div", { className: "bg-[#eff4ff] p-3 rounded-lg text-[#002045]", children: _jsx(Clock, { size: 20 }) })] })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6 shadow-sm space-y-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-[#002045] font-title-lg flex items-center gap-2", children: [_jsx(Filter, { size: 18 }), "Filter Logs"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-semibold text-[#43474e]", children: "Search Keyword" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search name, email, IP...", className: "w-full pl-10 pr-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors" }), _jsx(Search, { size: 16, className: "absolute left-3 top-3 text-[#74777f]" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-semibold text-[#43474e]", children: "Action Type" }), _jsxs("select", { value: filterAction, onChange: (e) => setFilterAction(e.target.value), className: "w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors bg-white", children: [_jsx("option", { value: "all", children: "All Actions" }), actionTypes.map((type) => (_jsx("option", { value: type, children: formatActionName(type) }, type)))] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-semibold text-[#43474e]", children: "Start Date" }), _jsx("div", { className: "relative", children: _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors" }) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-semibold text-[#43474e]", children: "End Date" }), _jsx("div", { className: "relative", children: _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors" }) })] })] }), (filterAction !== 'all' || searchQuery || startDate || endDate) && (_jsx("div", { className: "flex justify-end pt-2", children: _jsx("button", { onClick: () => {
                                            setFilterAction('all');
                                            setSearchQuery('');
                                            setStartDate('');
                                            setEndDate('');
                                        }, className: "text-xs text-[#006b5f] hover:text-[#005148] font-semibold hover:underline", children: "Clear Filters" }) }))] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl shadow-sm overflow-hidden", children: [loading ? (_jsx("div", { className: "py-20 flex items-center justify-center", children: _jsxs("div", { className: "text-center space-y-3", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Fetching audit entries..." })] }) })) : error ? (_jsxs("div", { className: "py-16 text-center max-w-md mx-auto px-4", children: [_jsx("div", { className: "w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] mx-auto mb-4", children: _jsx(Info, { size: 24 }) }), _jsx("h3", { className: "text-lg font-bold text-[#002045] mb-2", children: "Failed to Load Logs" }), _jsx("p", { className: "text-sm text-[#ba1a1a] mb-6", children: error }), _jsx(Button, { variant: "outline", onClick: fetchLogs, children: "Retry Connection" })] })) : paginatedLogs.length === 0 ? (_jsxs("div", { className: "py-20 text-center text-[#43474e]", children: [_jsx("p", { className: "text-lg font-semibold text-[#002045] mb-1", children: "No Entries Found" }), _jsx("p", { className: "text-sm", children: "Try modifying your filters or search query." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-[#eff4ff] border-b border-[#c4c6cf] text-[#002045] text-xs font-bold uppercase tracking-wider", children: [_jsx("th", { className: "px-6 py-4", children: "Timestamp" }), _jsx("th", { className: "px-6 py-4", children: "Action" }), _jsx("th", { className: "px-6 py-4", children: "Target User" }), _jsx("th", { className: "px-6 py-4", children: "Actor" }), _jsx("th", { className: "px-6 py-4", children: "IP Address" }), _jsx("th", { className: "px-6 py-4 text-right", children: "Details" })] }) }), _jsx("tbody", { className: "divide-y divide-[#c4c6cf] text-sm text-[#0b1c30]", children: paginatedLogs.map((log) => {
                                                    const isExpanded = expandedLogId === log.id;
                                                    const formattedDate = new Date(log.created_at).toLocaleString();
                                                    return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: "hover:bg-[#f8f9ff]/50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[#43474e] font-mono text-xs", children: formattedDate }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getActionBadgeColor(log.action_type)}`, children: formatActionName(log.action_type) }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#002045]", children: log.targetProfile?.full_name || 'System User' }), _jsx("p", { className: "text-xs text-[#43474e]", children: log.targetProfile?.email || 'N/A' })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "text-xs font-medium text-[#002045]", children: log.actorProfile?.email || 'System (Edge)' }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-[#43474e] text-xs font-mono", children: log.ip_address || '—' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("button", { onClick: () => setExpandedLogId(isExpanded ? null : log.id), className: "inline-flex items-center gap-1 text-xs text-[#006b5f] hover:text-[#005148] font-semibold hover:underline", children: [_jsx("span", { children: isExpanded ? 'Hide' : 'Inspect' }), isExpanded ? _jsx(ChevronUp, { size: 14 }) : _jsx(ChevronDown, { size: 14 })] }) })] }), _jsx(AnimatePresence, { children: isExpanded && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "bg-[#eff4ff]/30 px-6 py-4 border-b border-[#c4c6cf]", children: _jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: "space-y-3", children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-xs", children: [_jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-lg p-4 space-y-2", children: [_jsx("p", { className: "font-semibold text-[#002045]", children: "Session Details" }), _jsxs("ul", { className: "space-y-1 text-[#43474e] font-mono", children: [_jsxs("li", { children: [_jsx("strong", { className: "text-[#0b1c30]", children: "Log ID:" }), " ", log.id] }), _jsxs("li", { children: [_jsx("strong", { className: "text-[#0b1c30]", children: "User Agent:" }), " ", log.user_agent || 'Unknown'] }), _jsxs("li", { children: [_jsx("strong", { className: "text-[#0b1c30]", children: "IP Address:" }), " ", log.ip_address || 'Internal'] })] })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-lg p-4 space-y-2", children: [_jsx("p", { className: "font-semibold text-[#002045]", children: "Action Payload" }), _jsx("pre", { className: "text-[11px] text-gray-800 bg-[#f8f9ff] p-3 rounded border border-[#c4c6cf]/50 overflow-x-auto font-mono max-h-40", children: JSON.stringify(log.payload, null, 2) })] })] }) }) }) })) })] }, log.id));
                                                }) })] }) })), !loading && !error && totalPages > 1 && (_jsxs("div", { className: "px-6 py-4 bg-[#eff4ff]/20 border-t border-[#c4c6cf] flex items-center justify-between text-sm text-[#43474e]", children: [_jsxs("div", { children: ["Showing ", _jsx("span", { className: "font-semibold text-[#0b1c30]", children: (currentPage - 1) * itemsPerPage + 1 }), " to", ' ', _jsx("span", { className: "font-semibold text-[#0b1c30]", children: Math.min(currentPage * itemsPerPage, totalItems) }), ' ', "of ", _jsx("span", { className: "font-semibold text-[#0b1c30]", children: totalItems }), " entries"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setCurrentPage((p) => Math.max(p - 1, 1)), disabled: currentPage === 1, className: "px-3 py-1.5 border border-[#c4c6cf] rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium text-xs text-[#0b1c30]", children: "Previous" }), _jsx("button", { onClick: () => setCurrentPage((p) => Math.min(p + 1, totalPages)), disabled: currentPage === totalPages, className: "px-3 py-1.5 border border-[#c4c6cf] rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium text-xs text-[#0b1c30]", children: "Next" })] })] }))] })] }) })] }));
}
