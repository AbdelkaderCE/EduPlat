// ============================================================================
// src/pages/auth/LoginPage.tsx
// ============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabaseClient';
import { Button } from '../../components/shared/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data?.user) {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#eff4ff] flex items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#62fae3]/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#002045]/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#002045] mb-6">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-4xl font-bold text-[#002045] mb-2 font-title-lg">ScholarStream</h1>
          <p className="text-lg text-[#43474e]">Premium Educational Platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#c4c6cf] p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0b1c30] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="student@example.com"
                className="w-full px-4 py-3 rounded-lg border border-[#c4c6cf] bg-[#f8f9ff] text-[#0b1c30] placeholder-[#74777f] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-[#0b1c30]">
                  Password
                </label>
                <Link
                  to="/reset-password"
                  className="text-xs text-[#006b5f] hover:text-[#005148] transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-[#c4c6cf] bg-[#f8f9ff] text-[#0b1c30] placeholder-[#74777f] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 transition-all duration-200"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#ffdad6] border border-[#ba1a1a] rounded-lg"
              >
                <p className="text-sm text-[#ba1a1a]">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full">
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-[#43474e]">
            New to ScholarStream?{' '}
            <span className="text-[#006b5f] font-medium">Contact support to get started</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
