// ============================================================================
// src/pages/student/AccountSettings.tsx
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Profile } from '../../types';

interface FormData {
  fullName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (profile) {
      setFormData((prev) => ({
        ...prev,
        fullName: profile.full_name || '',
        email: user.email || '',
      }));
    }

    setLoading(false);
  }, [user, profile]);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-[#43474e] font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setErrorMessage('Full name is required');
      return false;
    }

    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setErrorMessage('Current password is required to set a new password');
        return false;
      }
      if (formData.newPassword.length < 8) {
        setErrorMessage('New password must be at least 8 characters');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (formData.newPassword) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (updateError) throw updateError;

        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setShowPasswordSection(false);
      }

      setSuccessMessage(formData.newPassword ? 'Profile and password updated successfully!' : 'Profile updated successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setErrorMessage('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Navigation (3 cols) */}
            <aside className="col-span-3">
              <motion.nav
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl border border-[#c4c6cf] overflow-hidden"
              >
                <ul className="divide-y divide-[#c4c6cf]">
                  <li>
                    <button
                      onClick={() => {
                        /* Current page */
                      }}
                      className="w-full px-6 py-4 text-left hover:bg-[#eff4ff] transition-colors bg-[#eff4ff] border-l-4 border-[#006b5f]"
                    >
                      <span className="font-medium text-[#002045]">Account Settings</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate('/student')}
                      className="w-full px-6 py-4 text-left hover:bg-[#eff4ff] transition-colors text-[#43474e]"
                    >
                      <span className="font-medium">Back to Dashboard</span>
                    </button>
                  </li>
                </ul>
              </motion.nav>
            </aside>

            {/* Right: Settings Form (9 cols) */}
            <div className="col-span-9 space-y-6">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl font-bold text-[#002045] font-title-lg">Account Settings</h1>
                <p className="text-[#43474e] mt-2">Manage your profile and account preferences</p>
              </motion.div>

              {/* Alert Messages */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                >
                  <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </motion.div>
              )}

              {/* Profile Information Section */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-8"
              >
                <h2 className="text-xl font-bold text-[#002045] mb-6 font-title-lg">Profile Information</h2>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-[#002045] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#002045] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#43474e] bg-[#f3f4f7] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#43474e] mt-1">Email cannot be changed. Contact support if needed.</p>
                  </div>

                  {/* Role */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-[#002045] mb-2">
                      Account Type
                    </label>
                    <input
                      type="text"
                      id="role"
                      value={profile.role === 'student' ? 'Student' : 'Administrator'}
                      disabled
                      className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#43474e] bg-[#f3f4f7] cursor-not-allowed"
                    />
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-semibold text-[#002045] mb-2">Member Since</label>
                    <p className="text-[#0b1c30]">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </motion.section>

              {/* Security Section */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#002045] font-title-lg flex items-center gap-2">
                    <Lock size={24} className="text-[#006b5f]" />
                    Security
                  </h2>
                </div>

                {!showPasswordSection ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Current Password */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-semibold text-[#002045] mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                        placeholder="Enter your current password"
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
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                        placeholder="Enter a new password (min. 8 characters)"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#002045] mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                        placeholder="Confirm your new password"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setFormData((prev) => ({
                            ...prev,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          }));
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.section>

              {/* Danger Zone */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-red-50 rounded-xl border border-red-200 p-8"
              >
                <h2 className="text-xl font-bold text-red-900 mb-6 font-title-lg">Danger Zone</h2>
                <div className="space-y-4">
                  <p className="text-sm text-red-800">Logging out will end your current session. You can log back in anytime.</p>
                  <Button variant="secondary" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </motion.section>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center justify-between"
              >
                <p className="text-sm text-[#43474e]">Changes are automatically saved.</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
