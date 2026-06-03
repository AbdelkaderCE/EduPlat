import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, Globe, Lock, PlayCircle, FileText,
  Wand2, AlertCircle, CheckCircle, Trash2, Upload, File,
  X, ExternalLink, BookOpen
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  course_id: string;
  lesson_order: number;
  cloudflare_asset_id: string | null;
  video_provider: string;
  body_content: string | null;
  is_preview: boolean;
  is_published: boolean;
}

interface CourseBasic {
  id: string;
  title: string;
}

interface Resource {
  id: string;
  label: string;
  file_url: string;
  file_type: string | null;
  created_at: string;
}

function autoSlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function LessonEditor() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<CourseBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [cloudflareAssetId, setCloudflareAssetId] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && lessonId) fetchAll();
  }, [courseId, lessonId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [lessonRes, courseRes, resourcesRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('courses').select('id, title').eq('id', courseId).single(),
        supabase.from('lesson_resources').select('*').eq('lesson_id', lessonId).order('created_at'),
      ]);
      if (!lessonRes.data) { setNotFound(true); return; }
      const l = lessonRes.data as Lesson;
      setLesson(l);
      setTitle(l.title);
      setSlug(l.slug);
      setCloudflareAssetId(l.cloudflare_asset_id || '');
      setBodyContent(l.body_content || '');
      setIsPreview(l.is_preview);
      setIsPublished(l.is_published);
      if (courseRes.data) setCourse(courseRes.data as CourseBasic);
      setResources((resourcesRes.data || []) as Resource[]);
    } finally {
      setLoading(false);
    }
  };

  const markDirty = () => setIsDirty(true);

  const save = async (publishOverride?: boolean) => {
    if (!title.trim() || !slug.trim()) {
      setMsg({ type: 'err', text: 'Title and slug are required' });
      return;
    }
    setSaving(true); setMsg(null);
    const pub = publishOverride !== undefined ? publishOverride : isPublished;
    try {
      const { error } = await supabase.from('lessons').update({
        title: title.trim(),
        slug: slug.trim(),
        cloudflare_asset_id: cloudflareAssetId.trim() || null,
        video_provider: cloudflareAssetId.trim() ? 'cloudflare' : 'none',
        body_content: bodyContent.trim() || null,
        is_preview: isPreview,
        is_published: pub,
      }).eq('id', lessonId);
      if (error) throw error;
      setIsPublished(pub);
      setIsDirty(false);
      setMsg({ type: 'ok', text: pub ? 'Lesson published' : 'Draft saved' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`File must be under ${maxMb}MB`);
      return;
    }
    setUploadingFile(true); setUploadError(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `lesson-resources/${lessonId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('resources').upload(path, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('resources').getPublicUrl(path);

      const { data: resourceRow, error: insertErr } = await supabase.from('lesson_resources').insert({
        lesson_id: lessonId,
        label: file.name,
        file_url: urlData.publicUrl,
        file_type: ext || null,
      }).select('*').single();
      if (insertErr) throw insertErr;

      setResources(prev => [...prev, resourceRow as Resource]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const deleteResource = async (resource: Resource) => {
    try {
      const url = new URL(resource.file_url);
      const pathParts = url.pathname.split('/resources/');
      if (pathParts[1]) {
        await supabase.storage.from('resources').remove([pathParts[1]]);
      }
      await supabase.from('lesson_resources').delete().eq('id', resource.id);
      setResources(prev => prev.filter(r => r.id !== resource.id));
    } catch (err) {
      console.error('Delete resource error:', err);
    } finally {
      setDeletingResourceId(null);
    }
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
        <h2 className="text-xl font-bold text-[#002045] mb-2">Lesson not found</h2>
        <Button variant="outline" size="md" onClick={() => navigate(`/admin/courses/${courseId}`)}>← Back to Course</Button>
      </div>
    </div>
  );

  const inputCls = "w-full px-4 py-3 border border-[#c4c6cf] rounded-lg text-[#0b1c30] text-sm focus:outline-none focus:border-[#006b5f] focus:ring-2 focus:ring-[#62fae3]/20 transition-colors";

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
            <Link to={`/admin/courses/${courseId}`} className="hover:text-[#006b5f] transition-colors truncate max-w-[160px]">
              {course?.title || 'Course'}
            </Link>
            <span>/</span>
            <span className="text-[#002045] font-medium truncate max-w-xs">{lesson?.title}</span>
          </div>

          {/* Top bar */}
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(`/admin/courses/${courseId}`)} className="text-[#006b5f] hover:text-[#005148] transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#002045] truncate">{title || 'Untitled Lesson'}</h1>
              <p className="text-sm text-[#43474e]">Lesson editor</p>
            </div>

            {isDirty && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">Unsaved changes</span>
            )}

            <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
              isPublished ? 'bg-[#e0f3f0] text-[#006b5f]' : 'bg-[#f3f4f7] text-[#43474e]'
            }`}>
              {isPublished ? <Globe size={11} /> : <Lock size={11} />}
              {isPublished ? 'Live' : 'Draft'}
            </span>
          </div>

          {/* Alert */}
          <AnimatePresence>
            {msg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`flex items-center gap-2 p-3 rounded-lg mb-6 text-sm ${
                  msg.type === 'ok'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {msg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-12 gap-6">
            {/* Main content */}
            <div className="col-span-8 space-y-6">

              {/* Basic info */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#c4c6cf] rounded-xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">Basic Info</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#002045] mb-2">Title *</label>
                    <input value={title} onChange={e => { setTitle(e.target.value); markDirty(); }} className={inputCls} placeholder="Lesson title" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#002045] mb-2">Slug *</label>
                    <div className="flex gap-2">
                      <input value={slug} onChange={e => { setSlug(e.target.value); markDirty(); }} className={inputCls} placeholder="lesson-slug" />
                      <button type="button" onClick={() => { setSlug(autoSlug(title)); markDirty(); }}
                        className="px-2 border border-[#c4c6cf] rounded-lg text-[#43474e] hover:border-[#006b5f] hover:text-[#006b5f] transition-colors flex-shrink-0">
                        <Wand2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Video */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white border border-[#c4c6cf] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <PlayCircle size={16} className="text-[#006b5f]" />
                  <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">Video</h2>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#002045] mb-2">
                    Cloudflare Stream Asset ID
                    <span className="ml-1 text-[#43474e] font-normal">(optional)</span>
                  </label>
                  <input
                    value={cloudflareAssetId}
                    onChange={e => { setCloudflareAssetId(e.target.value); markDirty(); }}
                    className={inputCls}
                    placeholder="e.g. abc123def456..."
                  />
                  {cloudflareAssetId && (
                    <p className="text-xs text-[#006b5f] mt-1 flex items-center gap-1">
                      <CheckCircle size={11} /> Video will be embedded via Cloudflare Stream
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Text content */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className="bg-white border border-[#c4c6cf] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#43474e]" />
                  <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">Notes / Text Content</h2>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#002045] mb-2">
                    Body <span className="text-[#43474e] font-normal">(markdown or plain text)</span>
                  </label>
                  <textarea
                    value={bodyContent}
                    onChange={e => { setBodyContent(e.target.value); markDirty(); }}
                    rows={10}
                    placeholder="Write lesson notes, instructions, or supplementary content..."
                    className={inputCls + ' resize-y min-h-[160px]'}
                  />
                </div>
              </motion.div>

              {/* Resources */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
                className="bg-white border border-[#c4c6cf] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload size={16} className="text-[#43474e]" />
                    <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">Resources</h2>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.csv,.xls,.xlsx" />
                    <span className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      uploadingFile
                        ? 'border-[#c4c6cf] text-[#43474e] cursor-not-allowed'
                        : 'border-[#006b5f] text-[#006b5f] hover:bg-[#e0f3f0] cursor-pointer'
                    }`}>
                      {uploadingFile ? (
                        <><div className="w-3 h-3 border-2 border-[#006b5f] border-t-transparent rounded-full animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload size={12} /> Upload File</>
                      )}
                    </span>
                  </label>
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                    <AlertCircle size={14} /> {uploadError}
                  </div>
                )}

                <p className="text-xs text-[#43474e]">
                  Upload PDFs, slides, spreadsheets or other files. Max 50MB per file. Stored in Supabase Storage.
                </p>

                {resources.length === 0 ? (
                  <div className="border border-dashed border-[#c4c6cf] rounded-lg p-6 text-center">
                    <File size={24} className="text-[#c4c6cf] mx-auto mb-2" />
                    <p className="text-sm text-[#43474e]">No resources attached yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-[#f8f9ff] border border-[#c4c6cf] rounded-lg group">
                        <File size={16} className="text-[#006b5f] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#002045] truncate">{r.label}</p>
                          {r.file_type && <p className="text-xs text-[#43474e] uppercase">{r.file_type}</p>}
                        </div>
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-[#43474e] hover:text-[#006b5f] transition-colors opacity-0 group-hover:opacity-100">
                          <ExternalLink size={14} />
                        </a>
                        <button onClick={() => setDeletingResourceId(r.id)}
                          className="p-1.5 text-[#43474e] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="col-span-4">
              <div className="sticky top-24 space-y-4">
                {/* Publish */}
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-bold text-[#002045]">Publish</h2>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#002045]">Status</p>
                      <p className="text-xs text-[#43474e]">{isPublished ? 'Visible to enrolled students' : 'Hidden from students'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsPublished(p => !p); markDirty(); }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-[#006b5f]' : 'bg-[#c4c6cf]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#002045]">Free preview</p>
                      <p className="text-xs text-[#43474e]">Visible without enrolment</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsPreview(p => !p); markDirty(); }}
                      className={`relative w-11 h-6 rounded-full transition-colors ${isPreview ? 'bg-[#002045]' : 'bg-[#c4c6cf]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPreview ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button variant="outline" size="md" onClick={() => save(false)} disabled={saving} className="w-full">
                      <Save size={14} /> Save Draft
                    </Button>
                    <Button variant="primary" size="md" onClick={() => save(true)} disabled={saving} className="w-full">
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                      ) : (
                        <><Globe size={14} /> Publish Lesson</>
                      )}
                    </Button>
                  </div>
                </motion.div>

                {/* Quick info */}
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                  className="bg-[#f8f9ff] border border-[#c4c6cf] rounded-xl p-5 text-xs text-[#43474e] space-y-2">
                  <p className="font-semibold text-[#002045] text-sm">Lesson Info</p>
                  <div className="flex justify-between">
                    <span>Order</span><span className="font-medium text-[#002045]">#{lesson?.lesson_order}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Video</span>
                    <span className={`font-medium ${cloudflareAssetId ? 'text-[#006b5f]' : 'text-[#43474e]'}`}>
                      {cloudflareAssetId ? 'Cloudflare Stream' : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resources</span><span className="font-medium text-[#002045]">{resources.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free preview</span><span className="font-medium text-[#002045]">{isPreview ? 'Yes' : 'No'}</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete resource confirm */}
      <AnimatePresence>
        {deletingResourceId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-[#002045] mb-2">Delete resource?</h3>
              <p className="text-sm text-[#43474e] mb-6">
                The file will be permanently deleted from storage. Students will lose access to it.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="md" onClick={() => setDeletingResourceId(null)} className="flex-1">Cancel</Button>
                <button
                  onClick={() => {
                    const r = resources.find(r => r.id === deletingResourceId);
                    if (r) deleteResource(r);
                  }}
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
