import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Layers3,
  PlayCircle,
  Save,
  Sparkles,
  CheckCircle2,
  Clock3,
  FilePlus2,
  Wand2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabaseClient';
import { Bundle, Course, Lesson } from '../../types';

type ContentType = 'course' | 'lesson' | 'bundle';
type PublishState = 'draft' | 'published';

export default function ContentCreator() {
  const { profile } = useAuth();
  const [contentType, setContentType] = useState<ContentType>('course');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PublishState>('draft');

  // Course-specific
  const [selectedCourse, setSelectedCourse] = useState('');

  // Lesson-specific
  const [cloudflareAssetId, setCloudflareAssetId] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Bundle-specific
  const [accessModel, setAccessModel] = useState<'dynamic' | 'static'>('dynamic');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real data from Supabase
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, lessonsRes, bundlesRes] = await Promise.all([
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('lessons').select('*').order('created_at', { ascending: false }),
        supabase.from('bundles').select('*').order('created_at', { ascending: false }),
      ]);

      setCourses(coursesRes.data || []);
      setLessons(lessonsRes.data || []);
      setBundles(bundlesRes.data || []);

      if (coursesRes.data?.length) setSelectedCourse(coursesRes.data[0].id);
    } catch (err) {
      console.error('[ContentCreator] Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Courses', value: courses.length, icon: BookOpen, color: '#006b5f' },
      { label: 'Lessons', value: lessons.length, icon: PlayCircle, color: '#002045' },
      { label: 'Bundles', value: bundles.length, icon: Layers3, color: '#007165' },
      { label: 'Published', value: courses.filter(c => c.is_published).length + lessons.filter(l => l.is_published).length, icon: FileText, color: '#43474e' },
    ],
    [courses, lessons, bundles]
  );

  const autoSlug = () => {
    if (!title.trim()) return;
    setSlug(
      title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    );
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setBodyContent('');
    setCloudflareAssetId('');
    setIsPreview(false);
    setStatus('draft');
    setAccessModel('dynamic');
  };

  const handleSave = async (publishOverride?: PublishState) => {
    const targetStatus = publishOverride ?? status;

    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required.');
      return;
    }

    if (contentType === 'lesson' && !selectedCourse) {
      setError('Please select a course for this lesson.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const isPublished = targetStatus === 'published';

      if (contentType === 'course') {
        const { error: insertError } = await supabase.from('courses').insert({
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim() || null,
          is_published: isPublished,
        });
        if (insertError) throw insertError;
      } else if (contentType === 'lesson') {
        // Get the next lesson_order for this course
        const { data: existingLessons } = await supabase
          .from('lessons')
          .select('lesson_order')
          .eq('course_id', selectedCourse)
          .order('lesson_order', { ascending: false })
          .limit(1);

        const nextOrder = ((existingLessons?.[0]?.lesson_order ?? 0) + 1);

        const { error: insertError } = await supabase.from('lessons').insert({
          slug: slug.trim(),
          title: title.trim(),
          course_id: selectedCourse,
          lesson_order: nextOrder,
          cloudflare_asset_id: cloudflareAssetId.trim() || null,
          video_provider: cloudflareAssetId.trim() ? 'cloudflare' : 'none',
          body_content: bodyContent.trim() || null,
          is_preview: isPreview,
          is_published: isPublished,
          duration_seconds: null,
        });
        if (insertError) throw insertError;
      } else if (contentType === 'bundle') {
        const { error: insertError } = await supabase.from('bundles').insert({
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim() || null,
          access_model: accessModel,
          is_published: isPublished,
        });
        if (insertError) throw insertError;
      }

      const label = contentType.charAt(0).toUpperCase() + contentType.slice(1);
      setSuccess(`${label} "${title.trim()}" ${isPublished ? 'published' : 'saved as draft'} successfully!`);
      resetForm();

      // Refresh data
      await fetchData();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('[ContentCreator] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const contentMeta = {
    course: {
      title: 'Course Builder',
      helper: 'Create a top-level course that students will see on their dashboard.',
      icon: BookOpen,
    },
    lesson: {
      title: 'Lesson Editor',
      helper: 'Add a lesson to an existing course. Supports video and/or text content.',
      icon: PlayCircle,
    },
    bundle: {
      title: 'Bundle Builder',
      helper: 'Group courses together into a bundle that can be granted as a single entitlement.',
      icon: Layers3,
    },
  }[contentType];

  const MetaIcon = contentMeta.icon;

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24 pb-12">
        <div className="px-12 py-8 max-w-[1280px] mx-auto space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-[#006b5f] hover:text-[#005148] transition-colors font-medium mb-3"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold text-[#002045] font-title-lg tracking-tight">
                Content Creator
              </h1>
              <p className="text-[#43474e] mt-2">
                Build and publish courses, lessons, and bundles for your students.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
              <Sparkles className="text-[#006b5f]" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#43474e] font-semibold">Signed in as</p>
                <p className="text-sm font-medium text-[#002045]">{profile?.full_name || 'Admin'}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e]">{stat.label}</p>
                    <Icon size={20} style={{ color: stat.color }} />
                  </div>
                  <p className="text-3xl font-bold text-[#002045]">
                    {loading ? '—' : stat.value}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Form Panel */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="xl:col-span-8"
            >
              <div className="bg-white border border-[#c4c6cf] rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0f3f0] text-[#006b5f] text-xs font-semibold uppercase tracking-wider mb-3">
                      <MetaIcon size={14} />
                      {contentMeta.title}
                    </div>
                    <h2 className="text-2xl font-bold text-[#002045] font-title-lg">Create new content</h2>
                    <p className="text-[#43474e] mt-1 text-sm">{contentMeta.helper}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={autoSlug}>
                    <Wand2 size={15} />
                    Auto-slug
                  </Button>
                </div>

                {/* Alerts */}
                {success && (
                  <div className="mb-6 rounded-xl border border-[#006b5f]/20 bg-[#e0f3f0] p-4 text-[#006b5f] flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                )}
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {/* Content Type Selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {(['course', 'lesson', 'bundle'] as ContentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setContentType(type); setError(null); }}
                      className={`rounded-xl border px-4 py-4 text-left transition-all ${
                        contentType === type
                          ? 'border-[#006b5f] bg-[#eff4ff] shadow-sm'
                          : 'border-[#c4c6cf] bg-white hover:border-[#006b5f]/40'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#002045] capitalize">{type}</p>
                      <p className="text-xs text-[#43474e] mt-1">
                        {type === 'course' && 'Top-level learning path'}
                        {type === 'lesson' && 'Single playable unit'}
                        {type === 'bundle' && 'Group of courses'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`e.g. ${contentType === 'course' ? 'Modern React Patterns' : contentType === 'lesson' ? 'Introduction to Hooks' : 'Frontend Starter Pack'}`}
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="auto-generated-slug"
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      />
                    </div>
                  </div>

                  {/* Description (course & bundle) */}
                  {(contentType === 'course' || contentType === 'bundle') && (
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Describe the content, learning goals, and key outcomes..."
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 resize-none"
                      />
                    </div>
                  )}

                  {/* Lesson-specific fields */}
                  {contentType === 'lesson' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">
                          Parent Course <span className="text-red-500">*</span>
                        </label>
                        {courses.length === 0 ? (
                          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
                            No courses yet. Create a course first before adding lessons.
                          </div>
                        ) : (
                          <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">
                          Cloudflare Stream Asset ID
                          <span className="ml-2 text-xs font-normal text-[#43474e]">(optional — for video lessons)</span>
                        </label>
                        <input
                          value={cloudflareAssetId}
                          onChange={(e) => setCloudflareAssetId(e.target.value)}
                          placeholder="e.g. abc123def456..."
                          className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">
                          Lesson Text Content
                          <span className="ml-2 text-xs font-normal text-[#43474e]">(optional — markdown or plain text)</span>
                        </label>
                        <textarea
                          value={bodyContent}
                          onChange={(e) => setBodyContent(e.target.value)}
                          rows={5}
                          placeholder="Write lesson notes, instructions, or supplementary content..."
                          className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="isPreview"
                          type="checkbox"
                          checked={isPreview}
                          onChange={(e) => setIsPreview(e.target.checked)}
                          className="w-4 h-4 accent-[#006b5f]"
                        />
                        <label htmlFor="isPreview" className="text-sm font-medium text-[#002045] cursor-pointer">
                          Mark as free preview lesson
                          <span className="ml-1 text-xs font-normal text-[#43474e]">(visible without entitlement)</span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Bundle-specific */}
                  {contentType === 'bundle' && (
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">Access Model</label>
                      <select
                        value={accessModel}
                        onChange={(e) => setAccessModel(e.target.value as 'dynamic' | 'static')}
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      >
                        <option value="dynamic">Dynamic (always includes new courses added to bundle)</option>
                        <option value="static">Static (locked to courses at time of purchase)</option>
                      </select>
                    </div>
                  )}

                  {/* Status & Actions */}
                  <div className="pt-4 border-t border-[#c4c6cf] flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="flex-1 sm:flex-none"
                    >
                      <Save size={16} />
                      Save as Draft
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={() => handleSave('published')}
                      disabled={saving}
                      loading={saving}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle2 size={16} />
                      Publish
                    </Button>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Sidebar: Content Library */}
            <aside className="xl:col-span-4 space-y-6">
              {/* Courses List */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-[#c4c6cf] rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-base font-bold text-[#002045] font-title-lg mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#006b5f]" />
                  Courses ({courses.length})
                </h3>
                {loading ? (
                  <div className="text-sm text-[#43474e]">Loading...</div>
                ) : courses.length === 0 ? (
                  <p className="text-sm text-[#43474e]">No courses yet. Create your first course.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#f8f9ff] border border-[#c4c6cf]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#002045] truncate">{course.title}</p>
                          <p className="text-xs text-[#43474e]">/{course.slug}</p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          course.is_published ? 'bg-[#e0f3f0] text-[#007165]' : 'bg-[#f3f4f7] text-[#43474e]'
                        }`}>
                          {course.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Lessons List */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white border border-[#c4c6cf] rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-base font-bold text-[#002045] font-title-lg mb-4 flex items-center gap-2">
                  <PlayCircle size={16} className="text-[#002045]" />
                  Lessons ({lessons.length})
                </h3>
                {loading ? (
                  <div className="text-sm text-[#43474e]">Loading...</div>
                ) : lessons.length === 0 ? (
                  <p className="text-sm text-[#43474e]">No lessons yet. Create a course first, then add lessons.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lessons.slice(0, 10).map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#f8f9ff] border border-[#c4c6cf]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#002045] truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {lesson.cloudflare_asset_id && (
                              <span className="text-[10px] font-semibold text-[#006b5f]">VIDEO</span>
                            )}
                            {lesson.is_preview && (
                              <span className="text-[10px] font-semibold text-[#007165]">PREVIEW</span>
                            )}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          lesson.is_published ? 'bg-[#e0f3f0] text-[#007165]' : 'bg-[#f3f4f7] text-[#43474e]'
                        }`}>
                          {lesson.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    ))}
                    {lessons.length > 10 && (
                      <p className="text-xs text-[#43474e] text-center pt-1">+{lessons.length - 10} more</p>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Publishing flow tips */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#002045] text-white rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <FilePlus2 size={18} />
                  <h3 className="text-base font-bold font-title-lg">Content workflow</h3>
                </div>
                <ul className="space-y-3 text-sm text-white/85">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-[#62fae3] flex-shrink-0" />
                    Create a <strong className="text-white">Course</strong> first — it's the container students see.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-[#62fae3] flex-shrink-0" />
                    Add <strong className="text-white">Lessons</strong> to a course with video or text content.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-[#62fae3] flex-shrink-0" />
                    Use <strong className="text-white">Provision</strong> to grant students access after payment.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-[#62fae3] flex-shrink-0" />
                    Group courses into <strong className="text-white">Bundles</strong> for multi-course entitlements.
                  </li>
                </ul>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
