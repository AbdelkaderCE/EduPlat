// ============================================================================
// src/pages/auth/ResetPasswordPage.tsx
// ============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';
import { Button } from '../../components/shared/Button';

type ResetStep = 'request' | 'confirm';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccessMessage('Check your email for a password reset link. You should receive it within a few minutes.');
      setTimeout(() => {
        setStep('confirm');
        setSuccessMessage(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter the code from your email');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const { error: resetError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });

      if (resetError) throw resetError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002045] to-[#006b5f] flex items-center justify-center p-4">
      {/* Back Button */}
      <Link
        to="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Login</span>
      </Link>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-[#002045] mb-2 font-title-lg">Reset Password</h1>
            <p className="text-[#43474e]">
              {step === 'request'
                ? 'Enter your email to receive a password reset link'
                : 'Enter the code from your email and your new password'}
            </p>
          </motion.div>

          {/* Alert Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
            >
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6"
            >
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </motion.div>
          )}

          {/* Step 1: Request Reset */}
          {step === 'request' && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleRequestReset}
              className="space-y-6"
            >
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#002045] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </motion.form>
          )}

          {/* Step 2: Confirm Reset */}
          {step === 'confirm' && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleConfirmReset}
              className="space-y-6"
            >
              {/* Code Input */}
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-[#002045] mb-2">
                  Reset Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter the code from your email"
                  className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-[#002045] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#002045] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] placeholder-[#a8adb8] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setError(null);
                }}
                className="w-full py-2 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors"
              >
                Use a different email
              </button>
            </motion.form>
          )}

          {/* Divider */}
          <div className="my-8 border-t border-[#c4c6cf]" />

          {/* Footer */}
          <p className="text-center text-sm text-[#43474e]">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-[#006b5f] hover:text-[#005148] transition-colors">
              Back to login
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"
      />
    </div>
  );
}
