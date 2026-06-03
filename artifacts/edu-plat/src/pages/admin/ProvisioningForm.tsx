import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowLeft, UserPlus, Users } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'new' | 'existing';

interface ExistingStudent {
  user_id: string;
  full_name: string | null;
  email: string;
}

export default function ProvisioningForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<Mode>('new');

  // New student fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Existing student selection
  const [students, setStudents] = useState<ExistingStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Shared fields
  const [paymentReference, setPaymentReference] = useState('');
  const [contentType, setContentType] = useState<'single_course' | 'bundle' | 'all_access'>('single_course');
  const [courseId, setCourseId] = useState('');
  const [bundleId, setBundleId] = useState('');

  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [bundles, setBundles] = useState<Array<{ id: string; title: string }>>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    if (mode === 'existing') fetchStudents();
  }, [mode]);

  const fetchContent = async () => {
    try {
      const [coursesRes, bundlesRes] = await Promise.all([
        supabase.from('courses').select('id, title').eq('is_published', true),
        supabase.from('bundles').select('id, title').eq('is_published', true),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data as any);
      if (bundlesRes.data) setBundles(bundlesRes.data as any);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'student')
        .eq('status', 'active')
        .order('full_name');
      if (data) setStudents(data as ExistingStudent[]);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccessMessage(null);
    setSelectedStudentId('');
    setFullName('');
    setEmail('');
    setCourseId('');
    setBundleId('');
    setContentType('single_course');
  };

  const validate = (): boolean => {
    if (mode === 'new') {
      if (!fullName.trim()) { setError('Full name is required'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return false; }
    } else {
      if (!selectedStudentId) { setError('Please select a student'); return false; }
    }
    if (contentType === 'single_course' && !courseId) { setError('Please select a course'); return false; }
    if (contentType === 'bundle' && !bundleId) { setError('Please select a bundle'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let targetEmail = email;
    let targetName = fullName;

    if (mode === 'existing') {
      const student = students.find(s => s.user_id === selectedStudentId);
      if (!student) { setError('Student not found'); return; }
      targetEmail = student.email;
      targetName = student.full_name || student.email;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: rpcError } = await supabase.rpc('web_provision_student', {
        p_student_email:     targetEmail,
        p_student_full_name: targetName,
        p_order_id:          paymentReference,
        p_entitlement_type:  contentType === 'all_access' ? 'all_access' : 'explicit',
        p_course_id:         contentType === 'single_course' ? courseId  : null,
        p_bundle_id:         contentType === 'bundle'        ? bundleId  : null,
        p_granted_by:        user?.id || null,
      });

      if (rpcError) {
        console.error('[Provision] RPC error:', rpcError);
        throw rpcError;
      }

      const label = mode === 'existing'
        ? `Access granted to ${targetName}!`
        : `Account created and access granted to ${targetName}!`;
      setSuccessMessage(label);

      // Reset
      setFullName(''); setEmail(''); setSelectedStudentId('');
      setPaymentReference(''); setCourseId(''); setBundleId('');
      setContentType('single_course');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      const msg = err?.message || err?.details || err?.hint || 'Failed to provision access';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.user_id === selectedStudentId);

  const inputCls = "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors";

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-24">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">

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
            <div className="col-span-8">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-bold text-[#002045]">Grant Course Access</h1>
                <p className="text-[#43474e] mt-2">Create a new student account or enrol an existing student</p>
              </motion.div>

              {/* Mode Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex rounded-xl border border-[#c4c6cf] bg-white overflow-hidden mb-6"
              >
                <button
                  type="button"
                  onClick={() => switchMode('new')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    mode === 'new'
                      ? 'bg-[#002045] text-white'
                      : 'text-[#43474e] hover:bg-[#f8f9ff]'
                  }`}
                >
                  <UserPlus size={16} />
                  New Student
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('existing')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                    mode === 'existing'
                      ? 'bg-[#002045] text-white'
                      : 'text-[#43474e] hover:bg-[#f8f9ff]'
                  }`}
                >
                  <Users size={16} />
                  Existing Student
                </button>
              </motion.div>

              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
                  >
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-6"
                  >
                    <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-xl border border-[#c4c6cf] p-8 space-y-6"
              >
                <AnimatePresence mode="wait">
                  {mode === 'new' ? (
                    <motion.div
                      key="new"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={e => { setFullName(e.target.value); setError(null); }}
                          placeholder="e.g., John Doe"
                          className={inputCls}
                        />
                      </div>
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(null); }}
                          placeholder="john@example.com"
                          className={inputCls}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="existing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <label className="block text-sm font-semibold text-[#002045] mb-2">
                        Select Student <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedStudentId}
                        onChange={e => { setSelectedStudentId(e.target.value); setError(null); }}
                        disabled={loadingStudents}
                        className={inputCls + ' disabled:bg-[#f3f4f7]'}
                      >
                        <option value="">
                          {loadingStudents ? 'Loading students...' : `Choose a student (${students.length} active)`}
                        </option>
                        {students.map(s => (
                          <option key={s.user_id} value={s.user_id}>
                            {s.full_name ? `${s.full_name} — ${s.email}` : s.email}
                          </option>
                        ))}
                      </select>

                      {/* Selected student preview */}
                      {selectedStudent && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-center gap-3 p-3 bg-[#eff4ff] rounded-lg border border-[#dce9ff]"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#dce9ff] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#002045]">
                              {(selectedStudent.full_name || selectedStudent.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#002045]">{selectedStudent.full_name || '—'}</p>
                            <p className="text-xs text-[#43474e]">{selectedStudent.email}</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment Reference */}
                <div>
                  <label className="block text-sm font-semibold text-[#002045] mb-2">
                    Payment Reference <span className="text-[#43474e] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="e.g., ORD-2024-001"
                    className={inputCls}
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-semibold text-[#002045] mb-2">
                    Access Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={contentType}
                    onChange={e => { setContentType(e.target.value as any); setCourseId(''); setBundleId(''); setError(null); }}
                    className={inputCls}
                  >
                    <option value="single_course">Single Course</option>
                    <option value="bundle">Course Bundle</option>
                    <option value="all_access">All Access</option>
                  </select>
                </div>

                {/* Course Selector */}
                <AnimatePresence>
                  {contentType === 'single_course' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-semibold text-[#002045] mb-2">
                        Select Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={courseId}
                        onChange={e => { setCourseId(e.target.value); setError(null); }}
                        disabled={loadingContent}
                        className={inputCls + ' disabled:bg-[#f3f4f7]'}
                      >
                        <option value="">{loadingContent ? 'Loading...' : 'Choose a course'}</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </motion.div>
                  )}

                  {contentType === 'bundle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-semibold text-[#002045] mb-2">
                        Select Bundle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={bundleId}
                        onChange={e => { setBundleId(e.target.value); setError(null); }}
                        disabled={loadingContent}
                        className={inputCls + ' disabled:bg-[#f3f4f7]'}
                      >
                        <option value="">{loadingContent ? 'Loading...' : 'Choose a bundle'}</option>
                        {bundles.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                      </select>
                    </motion.div>
                  )}

                  {contentType === 'all_access' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-[#eff4ff] border border-[#006b5f] rounded-lg"
                    >
                      <p className="text-sm text-[#002045] font-medium">
                        This student will have access to all courses and bundles.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <div className="pt-4 border-t border-[#c4c6cf]">
                  <Button variant="primary" size="lg" type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {mode === 'existing' ? 'Enrolling...' : 'Creating account...'}
                      </>
                    ) : (
                      mode === 'existing' ? 'Enrol in Course' : 'Create Account & Grant Access'
                    )}
                  </Button>
                </div>
              </motion.form>
            </div>

            {/* Right: Info */}
            <aside className="col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-6 sticky top-24 space-y-4"
              >
                <h3 className="text-lg font-bold text-[#002045]">How it works</h3>
                <div className="space-y-4 text-sm text-[#43474e]">
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1 flex items-center gap-2">
                      <UserPlus size={14} /> New Student
                    </h4>
                    <p>Creates a new account with a secure random password. Use the Students page to generate and send them a login password.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1 flex items-center gap-2">
                      <Users size={14} /> Existing Student
                    </h4>
                    <p>Adds a new course or bundle to a student who already has an account. No new account is created.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#002045] mb-1">Access Types</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Single Course:</strong> One specific course</li>
                      <li><strong>Bundle:</strong> All courses in a bundle</li>
                      <li><strong>All Access:</strong> Full platform access</li>
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
