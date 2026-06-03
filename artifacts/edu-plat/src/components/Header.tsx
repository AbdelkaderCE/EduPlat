import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

export function Header() {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#c4c6cf] shadow-sm h-16">
      <div className="max-w-[1280px] mx-auto px-12 h-full flex items-center justify-between">
        {/* Left: Logo & Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#002045] flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-[#002045] font-bold text-lg font-title-lg">ScholarStream</span>
        </Link>

        {/* Center: Nav Links (admin only) */}
        {isAdmin && (
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-[#43474e] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors">
              Dashboard
            </Link>
            <Link to="/admin/provision" className="px-3 py-2 rounded-lg text-sm font-medium text-[#43474e] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors">
              Provision
            </Link>
            <Link to="/admin/courses" className="px-3 py-2 rounded-lg text-sm font-medium text-[#43474e] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors">
              Courses
            </Link>
            <Link to="/admin/students" className="px-3 py-2 rounded-lg text-sm font-medium text-[#43474e] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors">
              Students
            </Link>
            <Link to="/admin/audit" className="px-3 py-2 rounded-lg text-sm font-medium text-[#43474e] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors">
              Audit Log
            </Link>
            <Link to="/admin/pdfs" className="px-3 py-2 rounded-lg text-sm font-semibold text-[#006b5f] hover:text-[#002045] hover:bg-[#eff4ff] transition-colors flex items-center gap-1">
              📄 PDF Tracking
            </Link>
          </nav>
        )}

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-[#eff4ff] rounded-lg transition-colors"
          >
            <Bell size={20} className="text-[#43474e]" />
          </motion.button>

          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-full bg-[#dce9ff] flex items-center justify-center border border-[#c4c6cf] hover:border-[#006b5f] transition-colors"
            >
              <User size={20} className="text-[#002045]" />
            </motion.button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#c4c6cf] overflow-hidden z-20"
                >
                  <div className="px-4 py-3 border-b border-[#c4c6cf]">
                    <p className="text-sm font-semibold text-[#0b1c30]">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-[#43474e] truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#e0f3f0] text-[#006b5f]">
                      {profile?.role}
                    </span>
                  </div>

                  {!isAdmin && (
                    <Link
                      to="/student/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={16} className="text-[#43474e]" />
                      Account Settings
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
