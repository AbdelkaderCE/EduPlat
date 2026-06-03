import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, RefreshCw, Copy, Check, Eye, EyeOff,
  Search, UserCheck, UserX, AlertCircle, X
} from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../config/supabaseClient';
import { Profile } from '../../types/index';

interface StudentRow extends Profile {
  entitlement_count?: number;
}

interface PasswordResult {
  userId: string;
  email: string;
  name: string;
  password: string;
}

export default function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetting, setResetting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [passwordResult, setPasswordResult] = useState<PasswordResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setStudents((data as StudentRow[]) || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleResetPassword = async (student: StudentRow) => {
    setResetting(student.user_id);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'admin_reset_student_password',
        { p_user_id: student.user_id }
      );
      if (rpcError) throw rpcError;
      const result = data as { password: string };
      setPasswordResult({
        userId: student.user_id,
        email: student.email,
        name: student.full_name || student.email,
        password: result.password,
      });
      setShowPassword(false);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    } finally {
      setResetting(null);
    }
  };

  const handleToggleStatus = async (student: StudentRow) => {
    const newStatus = student.status === 'active' ? 'suspended' : 'active';
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', student.user_id);
      if (err) throw err;
      setStudents(prev =>
        prev.map(s => s.user_id === student.user_id ? { ...s, status: newStatus } : s)
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to update student status');
    }
  };

  const handleCopy = async () => {
    if (!passwordResult) return;
    await navigator.clipboard.writeText(passwordResult.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      invited: 'bg-blue-100 text-blue-700',
      suspended: 'bg-red-100 text-red-700',
      deleted: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">

          {/* Back */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#002045]">Students</h1>
              <p className="text-[#43474e] mt-1">{students.length} total students</p>
            </div>
            <button
              onClick={fetchStudents}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c4c6cf] text-sm font-medium text-[#43474e] hover:bg-white transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
            >
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800 flex-1">{error}</p>
              <button onClick={() => setError(null)}><X size={16} className="text-red-400" /></button>
            </motion.div>
          )}

          {/* Password Modal */}
          <AnimatePresence>
            {passwordResult && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-40"
                  onClick={() => setPasswordResult(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-2xl shadow-2xl border border-[#c4c6cf] w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[#002045]">New Password Generated</h2>
                      <button
                        onClick={() => setPasswordResult(null)}
                        className="p-1 rounded-lg hover:bg-[#eff4ff] transition-colors"
                      >
                        <X size={20} className="text-[#43474e]" />
                      </button>
                    </div>

                    <p className="text-sm text-[#43474e] mb-4">
                      Send this password to <span className="font-semibold text-[#002045]">{passwordResult.name}</span> at{' '}
                      <span className="font-semibold text-[#002045]">{passwordResult.email}</span>.
                      They can change it after signing in.
                    </p>

                    <div className="bg-[#f8f9ff] border border-[#c4c6cf] rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-[#43474e] uppercase tracking-wider mb-2">Generated Password</p>
                      <div className="flex items-center gap-3">
                        <span className="flex-1 font-mono text-lg font-bold text-[#002045] tracking-widest">
                          {showPassword ? passwordResult.password : '•'.repeat(passwordResult.password.length)}
                        </span>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 rounded-lg hover:bg-white transition-colors text-[#43474e]"
                          title={showPassword ? 'Hide' : 'Show'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#006b5f] text-white font-semibold hover:bg-[#005148] transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check size={18} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copy Password
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[#43474e] text-center mt-3">
                      This password will not be shown again. Copy it now.
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#43474e]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-[#c4c6cf] rounded-xl bg-white text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
            />
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-[#c4c6cf] overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#43474e]">
                <Users size={48} className="mb-4 opacity-30" />
                <p className="font-medium">{search ? 'No students match your search' : 'No students yet'}</p>
                <p className="text-sm mt-1">
                  {!search && (
                    <button onClick={() => navigate('/admin/provision')} className="text-[#006b5f] hover:underline">
                      Provision your first student →
                    </button>
                  )}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#c4c6cf] bg-[#f8f9ff]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#43474e] uppercase tracking-wider">Student</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#43474e] uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#43474e] uppercase tracking-wider">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-[#43474e] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, i) => (
                    <motion.tr
                      key={student.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[#f3f4f7] last:border-0 hover:bg-[#f8f9ff] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#dce9ff] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[#002045]">
                              {(student.full_name || student.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#0b1c30] text-sm">{student.full_name || '—'}</p>
                            <p className="text-xs text-[#43474e]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{statusBadge(student.status)}</td>
                      <td className="px-6 py-4 text-sm text-[#43474e]">
                        {new Date(student.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(student)}
                            disabled={resetting === student.user_id}
                            title="Reset Password"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eff4ff] text-[#002045] hover:bg-[#dce9ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resetting === student.user_id ? (
                              <div className="w-3.5 h-3.5 border-2 border-[#002045] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                            Reset Password
                          </button>

                          {/* Suspend / Activate */}
                          <button
                            onClick={() => handleToggleStatus(student)}
                            title={student.status === 'active' ? 'Suspend' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              student.status === 'active'
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {student.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
