// ============================================================================
// src/pages/admin/AuditLog.tsx
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Clock,
  User,
  Shield,
  Activity
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { AccessAuditLog, Profile } from '../../types';

interface MappedAuditLog extends AccessAuditLog {
  actorProfile?: { email: string; full_name: string | null };
  targetProfile?: { email: string; full_name: string | null };
}

export default function AuditLog() {
  const navigate = useNavigate();
  const { profile: adminProfile } = useAuth();

  const [logs, setLogs] = useState<AccessAuditLog[]>([]);
  const [mappedLogs, setMappedLogs] = useState<MappedAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // UI States
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
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

      if (auditError) throw auditError;
      
      const rawLogs = (auditData || []) as AccessAuditLog[];
      setLogs(rawLogs);

      // Fetch user profile information to display names/emails instead of raw UUIDs
      const uniqueUserIds = Array.from(
        new Set(
          rawLogs
            .flatMap((log) => [log.actor_user_id, log.target_user_id])
            .filter((id): id is string => !!id)
        )
      );

      let profilesMap: Record<string, { email: string; full_name: string | null }> = {};

      if (uniqueUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', uniqueUserIds);

        if (profilesError) {
          console.warn('Failed to fetch user profiles for mapping:', profilesError);
        } else if (profilesData) {
          profilesData.forEach((prof: { user_id: string; email: string; full_name: string | null }) => {
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
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading audit logs');
    } finally {
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

      if (
        !targetEmail.includes(q) &&
        !targetName.includes(q) &&
        !actorEmail.includes(q) &&
        !actorName.includes(q) &&
        !ip.includes(q) &&
        !resourceId.includes(q) &&
        !action.includes(q)
      ) {
        return false;
      }
    }

    // 3. Start Date Filter
    if (startDate) {
      const logDate = new Date(log.created_at);
      const filterStart = new Date(startDate);
      filterStart.setHours(0, 0, 0, 0);
      if (logDate < filterStart) return false;
    }

    // 4. End Date Filter
    if (endDate) {
      const logDate = new Date(log.created_at);
      const filterEnd = new Date(endDate);
      filterEnd.setHours(23, 59, 59, 999);
      if (logDate > filterEnd) return false;
    }

    return true;
  });

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterAction, searchQuery, startDate, endDate]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

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

  const getActionBadgeColor = (action: string) => {
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

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24 pb-12">
        <div className="px-12 py-8 max-w-[1280px] mx-auto space-y-8">
          
          {/* Top Bar with Navigation */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors mb-2 font-medium"
              >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
              </motion.button>
              <h1 className="text-4xl font-bold text-[#002045] font-title-lg tracking-tight">
                Access Audit Logs
              </h1>
              <p className="text-[#43474e]">
                Monitor all platform authorization events, content access, and user provisioning history.
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0 || loading}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1">Total Logs</p>
                <p className="text-2xl font-bold text-[#002045]">{logs.length}</p>
              </div>
              <div className="bg-[#eff4ff] p-3 rounded-lg text-[#002045]">
                <Activity size={20} />
              </div>
            </div>
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1">Filtered</p>
                <p className="text-2xl font-bold text-[#006b5f]">{filteredLogs.length}</p>
              </div>
              <div className="bg-[#e0f3f0] p-3 rounded-lg text-[#006b5f]">
                <Filter size={20} />
              </div>
            </div>
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1">Provisioning</p>
                <p className="text-2xl font-bold text-[#007165]">
                  {logs.filter(l => l.action_type === 'entitlement_granted').length}
                </p>
              </div>
              <div className="bg-[#e0f3f0] p-3 rounded-lg text-[#007165]">
                <Shield size={20} />
              </div>
            </div>
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-1">Video Plays</p>
                <p className="text-2xl font-bold text-[#002045]">
                  {logs.filter(l => l.action_type === 'lesson_playback_requested').length}
                </p>
              </div>
              <div className="bg-[#eff4ff] p-3 rounded-lg text-[#002045]">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Filters Area */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-[#002045] font-title-lg flex items-center gap-2">
              <Filter size={18} />
              Filter Logs
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Query */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#43474e]">Search Keyword</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, IP..."
                    className="w-full pl-10 pr-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors"
                  />
                  <Search size={16} className="absolute left-3 top-3 text-[#74777f]" />
                </div>
              </div>

              {/* Action Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#43474e]">Action Type</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors bg-white"
                >
                  <option value="all">All Actions</option>
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatActionName(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#43474e]">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#43474e]">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Reset Filters Option */}
            {(filterAction !== 'all' || searchQuery || startDate || endDate) && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setFilterAction('all');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-[#006b5f] hover:text-[#005148] font-semibold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto" />
                  <p className="text-[#43474e] font-medium">Fetching audit entries...</p>
                </div>
              </div>
            ) : error ? (
              <div className="py-16 text-center max-w-md mx-auto px-4">
                <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] mx-auto mb-4">
                  <Info size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#002045] mb-2">Failed to Load Logs</h3>
                <p className="text-sm text-[#ba1a1a] mb-6">{error}</p>
                <Button variant="outline" onClick={fetchLogs}>
                  Retry Connection
                </Button>
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="py-20 text-center text-[#43474e]">
                <p className="text-lg font-semibold text-[#002045] mb-1">No Entries Found</p>
                <p className="text-sm">Try modifying your filters or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[#002045] text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Target User</th>
                      <th className="px-6 py-4">Actor</th>
                      <th className="px-6 py-4">IP Address</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6cf] text-sm text-[#0b1c30]">
                    {paginatedLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const formattedDate = new Date(log.created_at).toLocaleString();

                      return (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-[#f8f9ff]/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-[#43474e] font-mono text-xs">
                              {formattedDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getActionBadgeColor(log.action_type)}`}>
                                {formatActionName(log.action_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-[#002045]">
                                  {log.targetProfile?.full_name || 'System User'}
                                </p>
                                <p className="text-xs text-[#43474e]">{log.targetProfile?.email || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-medium text-[#002045]">
                                {log.actorProfile?.email || 'System (Edge)'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[#43474e] text-xs font-mono">
                              {log.ip_address || '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 text-xs text-[#006b5f] hover:text-[#005148] font-semibold hover:underline"
                              >
                                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded JSON Details Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={6} className="bg-[#eff4ff]/30 px-6 py-4 border-b border-[#c4c6cf]">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                  >
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div className="bg-white border border-[#c4c6cf] rounded-lg p-4 space-y-2">
                                        <p className="font-semibold text-[#002045]">Session Details</p>
                                        <ul className="space-y-1 text-[#43474e] font-mono">
                                          <li><strong className="text-[#0b1c30]">Log ID:</strong> {log.id}</li>
                                          <li><strong className="text-[#0b1c30]">User Agent:</strong> {log.user_agent || 'Unknown'}</li>
                                          <li><strong className="text-[#0b1c30]">IP Address:</strong> {log.ip_address || 'Internal'}</li>
                                        </ul>
                                      </div>
                                      <div className="bg-white border border-[#c4c6cf] rounded-lg p-4 space-y-2">
                                        <p className="font-semibold text-[#002045]">Action Payload</p>
                                        <pre className="text-[11px] text-gray-800 bg-[#f8f9ff] p-3 rounded border border-[#c4c6cf]/50 overflow-x-auto font-mono max-h-40">
                                          {JSON.stringify(log.payload, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && totalPages > 1 && (
              <div className="px-6 py-4 bg-[#eff4ff]/20 border-t border-[#c4c6cf] flex items-center justify-between text-sm text-[#43474e]">
                <div>
                  Showing <span className="font-semibold text-[#0b1c30]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-semibold text-[#0b1c30]">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{' '}
                  of <span className="font-semibold text-[#0b1c30]">{totalItems}</span> entries
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-[#c4c6cf] rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium text-xs text-[#0b1c30]"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-[#c4c6cf] rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors font-medium text-xs text-[#0b1c30]"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
