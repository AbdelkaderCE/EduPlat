// ============================================================================
// src/pages/admin/ProvisioningForm.tsx
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface ProvisioningFormData {
  fullName: string;
  email: string;
  paymentReference: string;
  contentType: 'single_course' | 'bundle' | 'all_access';
  courseId?: string;
  bundleId?: string;
}

export default function ProvisioningForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ProvisioningFormData>({
    fullName: '',
    email: '',
    paymentReference: '',
    contentType: 'single_course',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [bundles, setBundles] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  React.useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [coursesRes, bundlesRes] = await Promise.all([
        supabase.from('courses').select('id, title'),
        supabase.from('bundles').select('id, title'),
      ]);

      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (bundlesRes.data) setBundles(bundlesRes.data as any);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (
      formData.contentType === 'single_course' &&
      !formData.courseId
    ) {
      setError('Please select a course');
      return false;
    }

    if (formData.contentType === 'bundle' && !formData.bundleId) {
      setError('Please select a bundle');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Call the RPC function to provision entitlement
      const { error: rpcError } = await supabase.rpc(
        'web_provision_student',
        {
          p_student_email: formData.email,
          p_student_full_name: formData.fullName,
          p_order_id: formData.paymentReference,
          p_entitlement_type:
            formData.contentType === 'all_access' ? 'all_access' : 'explicit',
          p_course_id:
            formData.contentType === 'single_course'
              ? formData.courseId
              : null,
          p_bundle_id:
            formData.contentType === 'bundle' ? formData.bundleId : null,
          p_granted_by: user?.id || null,
        }
      );

      if (rpcError) {
        console.error('[Provision] RPC error:', rpcError);
        throw rpcError;
      }

      setSuccessMessage(
        `Successfully provisioned access for ${formData.fullName}!`
      );

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        paymentReference: '',
        contentType: 'single_course',
      });

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      console.error('[Provision] Caught error:', err);
      const msg =
        err?.message ||
        err?.details ||
        err?.hint ||
        (typeof err === 'string' ? err : 'Failed to provision access');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: Form */}
            <div className="col-span-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold text-[#002045] font-title-lg">
                  Provision Student Access
                </h1>
                <p className="text-[#43474e] mt-2">
                  Manually grant course or bundle access to a student
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

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-[#c4c6cf] p-8 space-y-6"
              >
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-[#002045] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#002045] mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                  />
                </div>

                {/* Payment Reference */}
                <div>
                  <label htmlFor="paymentReference" className="block text-sm font-semibold text-[#002045] mb-2">
                    Payment Reference <span className="text-[#43474e] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="paymentReference"
                    name="paymentReference"
                    value={formData.paymentReference}
                    onChange={handleInputChange}
                    placeholder="e.g., ORD-2024-001"
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                  />
                  <p className="text-xs text-[#43474e] mt-1">
                    This links the provisioning to an external order/payment
                  </p>
                </div>

                {/* Content Type */}
                <div>
                  <label htmlFor="contentType" className="block text-sm font-semibold text-[#002045] mb-2">
                    Access Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors"
                  >
                    <option value="single_course">Single Course</option>
                    <option value="bundle">Course Bundle</option>
                    <option value="all_access">All Access</option>
                  </select>
                </div>

                {/* Course Selector */}
                {formData.contentType === 'single_course' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="courseId" className="block text-sm font-semibold text-[#002045] mb-2">
                      Select Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="courseId"
                      name="courseId"
                      value={formData.courseId || ''}
                      onChange={handleInputChange}
                      disabled={loadingContent}
                      className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors disabled:bg-[#f3f4f7] disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingContent ? 'Loading courses...' : 'Choose a course'}
                      </option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* Bundle Selector */}
                {formData.contentType === 'bundle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <label htmlFor="bundleId" className="block text-sm font-semibold text-[#002045] mb-2">
                      Select Bundle <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="bundleId"
                      name="bundleId"
                      value={formData.bundleId || ''}
                      onChange={handleInputChange}
                      disabled={loadingContent}
                      className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors disabled:bg-[#f3f4f7] disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingContent ? 'Loading bundles...' : 'Choose a bundle'}
                      </option>
                      {bundles.map((bundle) => (
                        <option key={bundle.id} value={bundle.id}>
                          {bundle.title}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* All Access Info */}
                {formData.contentType === 'all_access' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="p-4 bg-[#eff4ff] border border-[#006b5f] rounded-lg"
                  >
                    <p className="text-sm text-[#002045] font-medium">
                      This student will have access to all courses and bundles.
                    </p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div className="pt-4 border-t border-[#c4c6cf]">
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
                        Provisioning...
                      </>
                    ) : (
                      'Grant Access'
                    )}
                  </Button>
                </div>
              </motion.form>
            </div>

            {/* Right: Info Card */}
            <aside className="col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-6 sticky top-24"
              >
                <h3 className="text-lg font-bold text-[#002045] mb-4 font-title-lg">
                  About Provisioning
                </h3>
                <div className="space-y-4 text-sm text-[#43474e]">
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1">What is provisioning?</h4>
                    <p>
                      Provisioning creates a new student account and grants access to selected courses or bundles in a single atomic transaction.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1">Payment Reference</h4>
                    <p>
                      Link this provisioning to an external order ID or payment reference for reconciliation and auditing.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1">Access Types</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Single Course:</strong> Access to one specific course
                      </li>
                      <li>
                        <strong>Bundle:</strong> Access to all courses in a bundle
                      </li>
                      <li>
                        <strong>All Access:</strong> Complete platform access
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
