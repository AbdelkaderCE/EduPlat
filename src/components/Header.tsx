// ============================================================================
// src/components/Header.tsx
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

export function Header() {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

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

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-[#eff4ff] rounded-lg transition-colors"
          >
            <Bell size={20} className="text-[#43474e]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full" />
          </motion.button>

          {/* Cart */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-[#eff4ff] rounded-lg transition-colors"
          >
            <ShoppingCart size={20} className="text-[#43474e]" />
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
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#c4c6cf] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#c4c6cf]">
                  <p className="text-sm font-medium text-[#0b1c30]">{profile?.full_name}</p>
                  <p className="text-xs text-[#43474e]">{user?.email}</p>
                </div>

                <Link
                  to={profile?.role === 'admin' ? '/admin' : '/student/settings'}
                  className="block px-4 py-2 text-sm text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Settings
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
