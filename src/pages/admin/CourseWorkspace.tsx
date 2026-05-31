import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Globe, Lock, GripVertical, Plus, Pencil,
  Trash2, PlayCircle, Eye, EyeOff, AlertCircle, CheckCircle,
  BookOpen, Wand2, ChevronUp, ChevronDown
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
}

interface LessonRow {
  id: string;
  title: string;
  slug: string;
  lesson_order: number;
  is_published: boolean;
  is_preview: boolean;
  cloudflare_asset_id: string | null;
  video_provider: string;
}

function autoSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CourseWorkspace() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Settings form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Add lesson form
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSlug, setNewLessonSlug] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);
  const [addLessonError, setAddLessonError] = useState<string | null>(null);

  // Delete confirm
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) fetchAll();
  }, [courseId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', courseId).single(),
        supabase.from('lessons').select('id, title, slug, lesson_order, is_published, is_preview, cloudflare_asset_id, video_provider')
          .eq('course_id', courseId).order('lesson_order'),
      ]);
      if (!courseRes.data) { setNotFound(true); return; }
      const c = courseRes.data as Course;
      setCourse(c);
      setTitle(c.title);
      setSlug(c.slug);
      setDescription(c.description || '');
      setIsPublished(c.is_published);
      setLessons((lessonsRes.data || []) as LessonRow[]);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!title.trim() || !slug.trim()) {
      setSettingsMsg({ type: 'err', text: 'Title and slug are required' });
      return;
    }
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const { error } = await supabase.from('courses').update({
        title: title.trim(), slug: slug.trim(),
        description: description.trim() || null,
        is_published: isPublished,
      }).eq('id', courseId);
      if (error) throw error;
      setSettingsMsg({ type: 'ok', text: 'Settings saved' });
      setCourse(prev => prev ? { ...prev, title: title.trim(), slug: slug.trim(), description: description.trim() || null, is_published: isPublished } : prev);
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch (err: any) {
      setSettingsMsg({ type: 'err', text: err.message || 'Save failed' });
    } finally {
      setSavingSettings(false);
    }
  };

  const addLesson = async () => {
    if (!newLessonTitle.trim()) { setAddLessonError('Title is required'); return; }
    if (!newLessonSlug.trim()) { setAddLessonError('Slug is required'); return; }
    setAddingLesson(true); setAddLessonError(null);
    try {
      const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.lesson_order)) + 1 : 1;
      const { data, error } = await supabase.from('lessons').insert({
        title: newLessonTitle.trim(),
        slug: newLessonSlug.trim(),
        course_id: courseId,
        lesson_order: nextOrder,
        is_published: false,
        is_preview: false,
        video_provider: 'none',
      }).select('id, title, slug, lesson_order, is_published, is_preview, cloudflare_asset_id, video_provider').single();
      if (error) throw error;
      setLessons(prev => [...prev, data as LessonRow]);
      setNewLessonTitle(''); setNewLessonSlug('');
      setShowAddLesson(false);
      navigate(`/admin/courses/${courseId}/lessons/${(data as LessonRow).id}`);
    } catch (err: any) {
      setAddLessonError(err.message || 'Failed to create lesson');
    } finally {
      setAddingLesson(false);
    }
  };

  const moveLesson = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    const updated = [...lessons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    const reordered = updated.map((l, i) => ({ ...l, lesson_order: i + 1 }));
    setLessons(reordered);
    await Promise.all(reordered.map(l =>
      supabase.from('lessons').update({ lesson_order: l.lesson_order }).eq('id', l.id)
    ));
  };

  const deleteLesson = async (id: string) => {
    await supabase.from('lessons').delete().eq('id', id);
    setLessons(prev => prev.filter(l => l.id !== id));
    setDeletingLessonId(null);
  };

  const toggleLessonPublish = async (lesson: LessonRow) => {
    const newVal = !lesson.is_published;
    await supabase.from('lessons').update({ is_published: newVal }).eq('id', lesson.id);
    setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, is_published: newVal } : l));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#006b5f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center text-center px-4">
      <div>
        <BookOpen size={40} className="text-[#c4c6cf] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#002045] mb-2">Course not found</h2>
        <Button variant="outline" size="md" onClick={() => navigate('/admin/courses')}>← Back to Courses</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-24 pb-16">
        <div className="px-12 py-8 max-w-[1280px] mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#43474e] mb-6">
            <Link to="/admin" className="hover:text-[#006b5f] transition-colors">Admin</Link>
            <span>/</span>
            <Link to="/admin/courses" className="hover:text-[#006b5f] transition-colors">Courses</Link>
            <span>/</span>
            <span className="text-[#002045] font-medium truncate max-w-xs">{course?.title}</span>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/admin/courses')} className="text-[#006b5f] hover:text-[#005148] transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#002045]">{course?.title}</h1>
              <p className="text-sm text-[#43474e]">/{course?.slug}</p>
            </div>
            <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
              isPublished ? 'bg-[#e0f3f0] text-[#006b5f]' : 'bg-[#f3f4f7] text-[#43474e]'
            }`}>
              {isPublished ? <Globe size={11} /> : <Lock size={11} />}
              {isPublished ? 'Live' : 'Draft'}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left: Settings */}
            <div className="col-span-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#c4c6cf] rounded-xl p-6 sticky top-24">
                <h2 className="text-base font-bold text-[#002045] mb-4">Course Settings</h2>

                <AnimatePresence>
                  {settingsMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
                        settingsMsg.type === 'ok'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}
                    >
                      {settingsMsg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {settingsMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#002045] mb-1">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#002045] mb-1">Slug</label>
                    <div className="flex gap-2">
                      <input value={slug} onChange={e => setSlug(e.target.value)}
                        className="flex-1 px-3 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f]" />
                      <button type="button" onClick={() => setSlug(autoSlug(title))}
                        className="px-2 border border-[#c4c6cf] rounded-lg text-[#43474e] hover:border-[#006b5f] hover:text-[#006b5f] transition-colors">
                        <Wand2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#002045] mb-1">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} resize-none
                      className="w-full px-3 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f] resize-none" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-[#c4c6cf] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#002045]">Published</p>
                      <p className="text-xs text-[#43474e]">Visible to students</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublished(p => !p)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-[#006b5f]' : 'bg-[#c4c6cf]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                  <Button variant="primary" size="md" onClick={saveSettings} disabled={savingSettings} className="w-full">
                    {savingSettings ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <><Save size={14} /> Save Settings</>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right: Curriculum */}
            <div className="col-span-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#002045]">
                    Curriculum <span className="text-[#43474e] font-normal">({lessons.length} lessons)</span>
                  </h2>
                  <Button variant="primary" size="sm" onClick={() => { setShowAddLesson(true); setNewLessonTitle(''); setNewLessonSlug(''); setAddLessonError(null); }}>
                    <Plus size={14} /> Add Lesson
                  </Button>
                </div>

                {/* Add lesson form */}
                <AnimatePresence>
                  {showAddLesson && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="bg-white border border-[#006b5f] rounded-xl p-5 space-y-3">
                        <h3 className="text-sm font-bold text-[#002045]">New Lesson</h3>
                        {addLessonError && (
                          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                            <AlertCircle size={14} /> {addLessonError}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[#002045] mb-1">Title *</label>
                            <input
                              autoFocus
                              value={newLessonTitle}
                              onChange={e => { setNewLessonTitle(e.target.value); setAddLessonError(null); }}
                              onBlur={() => { if (!newLessonSlug) setNewLessonSlug(autoSlug(newLessonTitle)); }}
                              placeholder="e.g. Introduction"
                              className="w-full px-3 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#002045] mb-1">Slug *</label>
                            <div className="flex gap-1">
                              <input
                                value={newLessonSlug}
                                onChange={e => { setNewLessonSlug(e.target.value); setAddLessonError(null); }}
                                placeholder="introduction"
                                className="flex-1 px-3 py-2 border border-[#c4c6cf] rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:border-[#006b5f]"
                              />
                              <button type="button" onClick={() => setNewLessonSlug(autoSlug(newLessonTitle))}
                                className="px-2 border border-[#c4c6cf] rounded-lg text-[#43474e] hover:border-[#006b5f] transition-colors">
                                <Wand2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" onClick={() => setShowAddLesson(false)}>Cancel</Button>
                          <Button variant="primary" size="sm" onClick={addLesson} disabled={addingLesson}>
                            {addingLesson ? 'Creating...' : 'Create & Edit Lesson'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lessons list */}
                {lessons.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#c4c6cf] rounded-xl p-12 text-center">
                    <PlayCircle size={32} className="text-[#c4c6cf] mx-auto mb-3" />
                    <p className="text-[#002045] font-semibold">No lessons yet</p>
                    <p className="text-sm text-[#43474e] mt-1">Add your first lesson to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, i) => (
                      <motion.div
                        key={lesson.id}
                        layout
                        className="group bg-white border border-[#c4c6cf] rounded-xl px-4 py-4 flex items-center gap-3 hover:border-[#006b5f] transition-colors"
                      >
                        {/* Order controls */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button onClick={() => moveLesson(i, -1)} disabled={i === 0}
                            className="p-0.5 text-[#c4c6cf] hover:text-[#006b5f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveLesson(i, 1)} disabled={i === lessons.length - 1}
                            className="p-0.5 text-[#c4c6cf] hover:text-[#006b5f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-[#f3f4f7] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#43474e]">{i + 1}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.cloudflare_asset_id && <PlayCircle size={14} className="text-[#006b5f]" />}
                          {lesson.is_preview && <Eye size={14} className="text-[#43474e]" title="Free preview" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#002045] truncate">{lesson.title}</p>
                          <p className="text-xs text-[#43474e] truncate">/{lesson.slug}</p>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          lesson.is_published ? 'bg-[#e0f3f0] text-[#006b5f]' : 'bg-[#f3f4f7] text-[#43474e]'
                        }`}>
                          {lesson.is_published ? 'Live' : 'Draft'}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleLessonPublish(lesson)}
                            className="p-1.5 rounded-lg text-[#43474e] hover:bg-[#f3f4f7] hover:text-[#006b5f] transition-colors"
                            title={lesson.is_published ? 'Unpublish' : 'Publish'}
                          >
                            {lesson.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.id}`)}
                            className="p-1.5 rounded-lg text-[#43474e] hover:bg-[#f3f4f7] hover:text-[#006b5f] transition-colors"
                            title="Edit lesson"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingLessonId(lesson.id)}
                            className="p-1.5 rounded-lg text-[#43474e] hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete lesson"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete lesson confirm */}
      <AnimatePresence>
        {deletingLessonId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-[#002045] mb-2">Delete lesson?</h3>
              <p className="text-sm text-[#43474e] mb-6">
                This will permanently delete the lesson and all its content. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="md" onClick={() => setDeletingLessonId(null)} className="flex-1">Cancel</Button>
                <button
                  onClick={() => deleteLesson(deletingLessonId)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
