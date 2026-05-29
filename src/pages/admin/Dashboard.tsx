import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, Activity, Shield, PlayCircle } from 'lucide-react';
import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { AccessAuditLog } from '../../types';

interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalBundles: number;
  totalEntitlements: number;
}

interface RecentLog extends AccessAuditLog {
  targetName?: string;
  targetEmail?: string;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalBundles: 0,
    totalEntitlements: 0,
  });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, coursesRes, bundlesRes, entitlementsRes, logsRes] = await Promise.all([
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('bundles').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('entitlements').select('id', { count: 'exact', head: true }).is('revoked_at', null),
        supabase.from('access_audit').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalStudents: studentsRes.count ?? 0,
        totalCourses: coursesRes.count ?? 0,
        totalBundles: bundlesRes.count ?? 0,
        totalEntitlements: entitlementsRes.count ?? 0,
      });

      if (logsRes.data && logsRes.data.length > 0) {
        const userIds = [...new Set(logsRes.data.map((l: AccessAuditLog) => l.target_user_id).filter(Boolean))];
        let profileMap: Record<string, { full_name: string | null; email: string }> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', userIds);

          if (profiles) {
            profiles.forEach((p: { user_id: string; full_name: string | null; email: string }) => {
              profileMap[p.user_id] = { full_name: p.full_name, email: p.email };
            });
          }
        }

        setRecentLogs(
          logsRes.data.map((log: AccessAuditLog) => ({
            ...log,
            targetName: log.target_user_id ? (profileMap[log.target_user_id]?.full_name ?? undefined) : undefined,
            targetEmail: log.target_user_id ? (profileMap[log.target_user_id]?.email ?? undefined) : undefined,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Active Students',
      value: loading ? '—' : stats.totalStudents.toLocaleString(),
      icon: Users,
      color: '#006b5f',
      bgColor: '#e0f3f0',
    },
    {
      label: 'Published Courses',
      value: loading ? '—' : stats.totalCourses,
      icon: BookOpen,
      color: '#002045',
      bgColor: '#eff4ff',
    },
    {
      label: 'Course Bundles',
      value: loading ? '—' : stats.totalBundles,
      icon: FileText,
      color: '#006b5f',
      bgColor: '#e0f3f0',
    },
    {
      label: 'Active Entitlements',
      value: loading ? '—' : stats.totalEntitlements.toLocaleString(),
      icon: Shield,
      color: '#007165',
      bgColor: '#e0f3f0',
    },
  ];

  const quickActions = [
    {
      title: 'Provision Student',
      description: 'Create an account and grant course access after payment',
      href: '/admin/provision',
      icon: '➕',
    },
    {
      title: 'Create Content',
      description: 'Add new courses, lessons, and bundles to the platform',
      href: '/admin/content',
      icon: '📝',
    },
    {
      title: 'View Audit Log',
      description: 'Monitor user access, entitlements, and platform events',
      href: '/admin/audit',
      icon: '📊',
    },
  ];

  const getActionColor = (action: string) => {
    if (action === 'entitlement_granted') return 'bg-[#e0f3f0] text-[#007165]';
    if (action === 'entitlement_revoked') return 'bg-[#ffdad6] text-[#ba1a1a]';
    if (action === 'lesson_playback_requested') return 'bg-[#eff4ff] text-[#002045]';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24">
        <div className="px-12 py-8 max-w-[1280px] mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-[#002045] mb-2 font-title-lg">
              Admin Dashboard
            </h1>
            <p className="text-[#43474e]">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Admin'}. Here's your platform overview.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ translateY: -4 }}
                  className="bg-white rounded-xl border border-[#c4c6cf] p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold text-[#43474e] uppercase tracking-wider">
                      {card.label}
                    </h3>
                    <div
                      style={{ backgroundColor: card.bgColor }}
                      className="p-2.5 rounded-lg"
                    >
                      <Icon size={18} style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#002045]">
                    {card.value}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-[#002045] mb-6 font-title-lg">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  to={action.href}
                  className="no-underline"
                >
                  <motion.div
                    whileHover={{ translateY: -4 }}
                    className="bg-white rounded-xl border border-[#c4c6cf] p-8 hover:border-[#006b5f] transition-colors cursor-pointer group"
                  >
                    <div className="text-4xl mb-4">{action.icon}</div>
                    <h3 className="text-lg font-semibold text-[#002045] mb-2 font-title-lg">
                      {action.title}
                    </h3>
                    <p className="text-[#43474e] text-sm mb-6">{action.description}</p>
                    <div className="flex items-center gap-2 text-[#006b5f] font-medium text-sm group-hover:translate-x-1 transition-transform">
                      Go to <span>→</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl border border-[#c4c6cf] p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#002045] font-title-lg flex items-center gap-2">
                <Activity size={20} className="text-[#006b5f]" />
                Recent Activity
              </h2>
              <Link to="/admin/audit" className="text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin" />
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <PlayCircle size={40} className="text-[#c4c6cf] mx-auto mb-3" />
                <p className="text-[#43474e]">No activity yet. Provision your first student to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-3 border-b border-[#c4c6cf] last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center flex-shrink-0">
                        <Shield size={16} className="text-[#006b5f]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#002045] text-sm">
                          {log.targetName || log.targetEmail || 'Unknown user'}
                        </p>
                        <p className="text-xs text-[#43474e]">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${getActionColor(log.action_type)}`}>
                      {log.action_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
