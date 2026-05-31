import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, PlayCircle, ArrowRight,
  Globe, Lock, AlertCircle, X, Wand2, Layers3
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  lesson_count?: number;
}

function autoSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CourseList() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, slug, description, is_published, created_at')
        .order('created_at', { ascending: false });

      if (!coursesData) { setLoading(false); return; }

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('course_id');

      const countMap: Record<string, number> = {};
      (lessonsData || []).forEach(l => {
        countMap[l.course_id] = (countMap[l.course_id] || 0) + 1;
      });

      setCourses(coursesData.map(c => ({ ...c, lesson_count: countMap[c.id] || 0 })));
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setNewTitle(''); setNewSlug(''); setNewDesc('');
    setCreateError(null);
    setShowModal(true);
  };

  const handleCreate = async (publish: boolean) => {
    if (!newTitle.trim()) { setCreateError('Title is required'); return; }
    if (!newSlug.trim()) { setCreateError('Slug is required'); return; }
    setCreating(true); setCreateError(null);
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({ title: newTitle.trim(), slug: newSlug.trim(), description: newDesc.trim() || null, is_published: publish })
        .select('id')
        .single();
      if (error) throw error;
      setShowModal(false);
      navigate(`/admin/courses/${data.id}`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const published = courses.filter(c => c.is_published).length;
  const totalLessons = courses.reduce((s, c) => s + (c.lesson_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">

          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <Link to="/admin" className="text-sm text-[#006b5f] hover:underline mb-2 inline-block">
                ← Admin
              </Link>
              <h1 className="text-3xl font-bold text-[#002045]">Courses</h1>
              <p className="text-[#43474e] mt-1">Create and manage your course catalogue</p>
            </div>
            <Button variant="primary" size="md" onClick={openModal}>
              <Plus size={16} /> New Course
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Courses', value: courses.length, icon: BookOpen, color: '#006b5f' },
              { label: 'Published',     value: published,       icon: Globe,     color: '#002045' },
              { label: 'Total Lessons', value: totalLessons,    icon: PlayCircle, color: '#43474e' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
                    <Icon size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#002045]">{loading ? '—' : s.value}</p>
                    <p className="text-xs text-[#43474e] font-medium">{s.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#43474e]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-3 border border-[#c4c6cf] rounded-lg bg-white text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20"
            />
          </div>

          {/* Course grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-[#c4c6cf] rounded-xl p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <BookOpen size={40} className="text-[#c4c6cf] mx-auto mb-4" />
              <p className="text-[#002045] font-semibold text-lg">
                {search ? 'No courses match your search' : 'No courses yet'}
              </p>
              <p className="text-[#43474e] text-sm mt-1">
                {search ? 'Try a different keyword' : 'Create your first course to get started'}
              </p>
              {!search && (
                <Button variant="primary" size="md" onClick={openModal} className="mt-6">
                  <Plus size={16} /> New Course
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                  className="group bg-white border border-[#c4c6cf] rounded-xl p-6 cursor-pointer hover:border-[#006b5f] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#e0f3f0] flex items-center justify-center flex-shrink-0">
                      <BookOpen size={18} className="text-[#006b5f]" />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full flex items-center gap-1 ${
                      course.is_published ? 'bg-[#e0f3f0] text-[#006b5f]' : 'bg-[#f3f4f7] text-[#43474e]'
                    }`}>
                      {course.is_published ? <Globe size={10} /> : <Lock size={10} />}
                      {course.is_published ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#002045] text-base mb-1 group-hover:text-[#006b5f] transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[#43474e] mb-3 truncate">/{course.slug}</p>
                  {course.description && (
                    <p className="text-sm text-[#43474e] mb-3 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#f3f4f7]">
                    <span className="text-xs text-[#43474e] flex items-center gap-1">
                      <PlayCircle size={12} /> {course.lesson_count} lesson{course.lesson_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-[#006b5f] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bundles link */}
          <div className="mt-10 pt-6 border-t border-[#c4c6cf]">
            <Link
              to="/admin/bundles"
              className="inline-flex items-center gap-2 text-sm text-[#43474e] hover:text-[#006b5f] transition-colors"
            >
              <Layers3 size={16} /> Manage Bundles →
            </Link>
          </div>
        </div>
      </main>

      {/* New Course Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#002045]">New Course</h2>
                <button onClick={() => setShowModal(false)} className="text-[#43474e] hover:text-[#002045] transition-colors">
                  <X size={20} />
                </button>
              </div>

              {createError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0" /> {createError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#002045] mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => { setNewTitle(e.target.value); setCreateError(null); }}
                    onBlur={() => { if (!newSlug) setNewSlug(autoSlug(newTitle)); }}
                    placeholder="e.g. Modern React Patterns"
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#002045] mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newSlug}
                      onChange={e => { setNewSlug(e.target.value); setCreateError(null); }}
                      placeholder="modern-react-patterns"
                      className="flex-1 px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setNewSlug(autoSlug(newTitle))}
                      className="px-3 py-2 border border-[#c4c6cf] rounded-lg text-[#43474e] hover:text-[#006b5f] hover:border-[#006b5f] transition-colors"
                      title="Auto-generate slug"
                    >
                      <Wand2 size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#002045] mb-2">
                    Description <span className="text-[#43474e] font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Brief description of the course..."
                    className="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#c4c6cf]">
                <Button variant="outline" size="md" onClick={() => handleCreate(false)} disabled={creating} className="flex-1">
                  Save as Draft
                </Button>
                <Button variant="primary" size="md" onClick={() => handleCreate(true)} disabled={creating} className="flex-1">
                  {creating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                  ) : 'Create & Open'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
