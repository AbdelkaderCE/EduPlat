// ============================================================================
// src/pages/admin/ContentCreator.tsx
// ============================================================================

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
  Upload,
  Wand2,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabaseClient';
import { Bundle, Course, Lesson } from '../../types';

type ContentType = 'course' | 'lesson' | 'bundle';
type PublishState = 'draft' | 'review' | 'published';

interface DraftContent {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  status: PublishState;
  updatedAt: string;
  description: string;
}

export default function ContentCreator() {
  const { profile } = useAuth();
  const [contentType, setContentType] = useState<ContentType>('course');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PublishState>('draft');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBundle, setSelectedBundle] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  
  // Real data from Supabase
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[ContentCreator] Fetching courses, lessons, and bundles...');
        const [coursesRes, lessonsRes, bundlesRes] = await Promise.all([
          supabase.from('courses').select('*'),
          supabase.from('lessons').select('*'),
          supabase.from('bundles').select('*'),
        ]);

        if (coursesRes.error) {
          console.error('[ContentCreator] Error fetching courses:', coursesRes.error);
        } else {
          console.log('[ContentCreator] Courses fetched:', coursesRes.data?.length, 'records');
          setCourses(coursesRes.data || []);
        }

        if (lessonsRes.error) {
          console.error('[ContentCreator] Error fetching lessons:', lessonsRes.error);
        } else {
          console.log('[ContentCreator] Lessons fetched:', lessonsRes.data?.length, 'records');
          setLessons(lessonsRes.data || []);
        }

        if (bundlesRes.error) {
          console.error('[ContentCreator] Error fetching bundles:', bundlesRes.error);
        } else {
          console.log('[ContentCreator] Bundles fetched:', bundlesRes.data?.length, 'records');
          setBundles(bundlesRes.data || []);
        }
        
        // Set initial selections
        if (coursesRes.data?.length) {
          setSelectedCourse(coursesRes.data[0].id);
          console.log('[ContentCreator] Set initial course:', coursesRes.data[0].id);
        }
        if (bundlesRes.data?.length) {
          setSelectedBundle(bundlesRes.data[0].id);
          console.log('[ContentCreator] Set initial bundle:', bundlesRes.data[0].id);
        }
      } catch (err) {
        console.error('[ContentCreator] Failed to fetch content data:', err);
        // Fall back to empty arrays if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Courses', value: courses.length, icon: BookOpen, color: '#006b5f' },
      { label: 'Lessons', value: lessons.length, icon: PlayCircle, color: '#002045' },
      { label: 'Bundles', value: bundles.length, icon: Layers3, color: '#007165' },
      { label: 'Drafts', value: drafts.length, icon: FileText, color: '#43474e' },
    ],
    [drafts.length, courses.length, lessons.length, bundles.length]
  );

  const autoSlug = () => {
    if (!title.trim()) return;
    setSlug(
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim()) {
      setSuccess(null);
      return;
    }

    const next: DraftContent = {
      id: `draft-${Date.now()}`,
      type: contentType,
      title: title.trim(),
      slug: slug.trim(),
      status,
      updatedAt: new Date().toISOString(),
      description: description.trim() || 'No description provided.',
    };

    setDrafts((current) => [next, ...current]);
    setSuccess(
      `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} "${title.trim()}" saved in demo mode.`
    );
    setTitle('');
    setSlug('');
    setDescription('');
    setStatus('draft');
    setTimeout(() => setSuccess(null), 4000);
  };

  const contentMeta = {
    course: {
      title: 'Course Builder',
      helper: 'Create a course shell, outline lessons, and manage publish state.',
      icon: BookOpen,
    },
    lesson: {
      title: 'Lesson Editor',
      helper: 'Draft a lesson, link a video asset, and set preview access.',
      icon: PlayCircle,
    },
    bundle: {
      title: 'Bundle Builder',
      helper: 'Group courses into a learning bundle with a shared access model.',
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
              <p className="text-[#43474e] mt-2 max-w-2xl">
                Demo workspace for building courses, lessons, and bundles without a backend.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-[#c4c6cf] bg-white px-4 py-3 shadow-sm">
              <Sparkles className="text-[#006b5f]" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wider text-[#43474e] font-semibold">Signed in as</p>
                <p className="text-sm font-medium text-[#002045]">{profile?.full_name || 'Admin Demo'}</p>
              </div>
            </div>
          </div>

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
                  <p className="text-3xl font-bold text-[#002045]">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
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
                    <p className="text-[#43474e] mt-2">{contentMeta.helper}</p>
                  </div>
                  <Button variant="outline" onClick={autoSlug}>
                    <Wand2 size={16} />
                    Auto-slug
                  </Button>
                </div>

                {success && (
                  <div className="mb-6 rounded-xl border border-[#006b5f]/20 bg-[#e0f3f0] p-4 text-[#006b5f] flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span className="text-sm font-medium">{success}</span>
                  </div>
                )}

                <form onSubmit={handlePublish} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['course', 'lesson', 'bundle'] as ContentType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContentType(type)}
                        className={`rounded-xl border px-4 py-4 text-left transition-all ${contentType === type
                          ? 'border-[#006b5f] bg-[#eff4ff] shadow-sm'
                          : 'border-[#c4c6cf] bg-white hover:border-[#006b5f]/40'
                          }`}
                      >
                        <p className="text-sm font-semibold text-[#002045] capitalize">{type}</p>
                        <p className="text-xs text-[#43474e] mt-1">
                          {type === 'course' && 'Top-level learning path'}
                          {type === 'lesson' && 'Single playable unit'}
                          {type === 'bundle' && 'Group of related courses'}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`e.g. ${contentType === 'course' ? 'Modern React Patterns' : contentType === 'lesson' ? 'Hooks Deep Dive' : 'Frontend Starter Pack'}`}
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">Slug</label>
                      <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="auto-generated-slug"
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#002045] mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe the content, learning goals, and key outcomes..."
                      className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#002045] mb-2">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PublishState)}
                        className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                      >
                        <option value="draft">Draft</option>
                        <option value="review">Ready for review</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    {contentType === 'lesson' && (
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">Linked course</label>
                        <select
                          value={selectedCourse}
                          onChange={(e) => setSelectedCourse(e.target.value)}
                          className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                        >
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {contentType === 'bundle' && (
                      <div>
                        <label className="block text-sm font-semibold text-[#002045] mb-2">Linked bundle</label>
                        <select
                          value={selectedBundle}
                          onChange={(e) => setSelectedBundle(e.target.value)}
                          className="w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-3 text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#006b5f]/20"
                        >
                          {bundles.map((bundle) => (
                            <option key={bundle.id} value={bundle.id}>
                              {bundle.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
                      <Save size={16} />
                      Save draft
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setStatus('published');
                        handlePublish(new Event('submit') as unknown as React.FormEvent);
                      }}
                    >
                      <Upload size={16} />
                      Publish content
                    </Button>
                  </div>
                </form>
              </div>
            </motion.section>

            <aside className="xl:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-[#c4c6cf] rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-[#002045] font-title-lg mb-4">Content library</h3>
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#c4c6cf] p-4">
                    <div className="flex items-center gap-2 text-[#006b5f] font-semibold mb-2">
                      <BookOpen size={16} />
                      Courses
                    </div>
                    <p className="text-sm text-[#43474e]">{courses.length} course records available for linking.</p>
                  </div>
                  <div className="rounded-xl border border-[#c4c6cf] p-4">
                    <div className="flex items-center gap-2 text-[#002045] font-semibold mb-2">
                      <PlayCircle size={16} />
                      Lessons
                    </div>
                    <p className="text-sm text-[#43474e]">{lessons.length} lesson records with preview flags.</p>
                  </div>
                  <div className="rounded-xl border border-[#c4c6cf] p-4">
                    <div className="flex items-center gap-2 text-[#007165] font-semibold mb-2">
                      <Layers3 size={16} />
                      Bundles
                    </div>
                    <p className="text-sm text-[#43474e]">{bundles.length} bundle records to group content.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white border border-[#c4c6cf] rounded-2xl shadow-sm p-6"
              >
                <h3 className="text-lg font-bold text-[#002045] font-title-lg mb-4">Recent drafts</h3>
                <div className="space-y-4">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="rounded-xl bg-[#f8f9ff] border border-[#c4c6cf] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#002045]">{draft.title}</p>
                          <p className="text-xs text-[#43474e] mt-1">/{draft.slug}</p>
                        </div>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[#e0f3f0] text-[#006b5f]">
                          {draft.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#43474e] mt-3 line-clamp-3">{draft.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#74777f]">
                        <Clock3 size={14} />
                        Updated {new Date(draft.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#002045] text-white rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <FilePlus2 size={18} />
                  <h3 className="text-lg font-bold font-title-lg">Publishing flow</h3>
                </div>
                <ul className="space-y-3 text-sm text-white/85">
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-[#62fae3]" />Save a draft before publishing.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-[#62fae3]" />Use the status field to mark review readiness.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-[#62fae3]" />Demo mode keeps everything local and safe.</li>
                </ul>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
