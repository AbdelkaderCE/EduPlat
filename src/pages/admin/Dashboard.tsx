// ============================================================================
// src/pages/admin/Dashboard.tsx
// ============================================================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, FileText, BarChart3 } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalBundles: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalBundles: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setStats({
      totalUsers: 1_234,
      totalCourses: 45,
      totalBundles: 12,
      totalRevenue: 125_678.50,
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
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

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
              Manage your educational platform, students, and content
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
                    <h3 className="text-sm font-medium text-[#43474e] uppercase tracking-wide">
                      {card.label}
                    </h3>
                    <div
                      style={{ backgroundColor: card.bgColor }}
                      className="p-3 rounded-lg"
                    >
                      <Icon size={20} style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#002045]">
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
            <h2 className="text-xl font-bold text-[#002045] mb-6 font-title-lg">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-4 border-b border-[#c4c6cf] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#006b5f]">
                        {String(item).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#002045]">Activity #{item}</p>
                      <p className="text-sm text-[#43474e]">
                        {new Date(Date.now() - item * 3600000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs px-3 py-1 bg-[#62fae3]/20 text-[#006b5f] rounded-full font-medium">
                    Completed
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
