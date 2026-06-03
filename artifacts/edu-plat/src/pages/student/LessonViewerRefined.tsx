import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Download, Clock, BookOpen,
  Play, CheckSquare, PlayCircle, FileText, Loader2,
  AlertCircle, CheckCircle2, File, ExternalLink,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Lesson } from '../../types';

interface Resource {
  id: string;
  label: string;
  file_url: string;
  file_type: string | null;
}

interface LessonFull extends Omit<Lesson, 'cloudflare_asset_id'> {
  body_content?: string | null;
  cloudflare_asset_id?: string | null;
  resources: Resource[];
}

interface OutlineLesson {
  id: string;
  title: string;
  is_preview: boolean;
  duration_seconds: number | null;
  lesson_order: number;
}

export default function LessonViewerRefined() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [outline, setOutline] = useState<OutlineLesson[]>([]);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!lessonId || !user || !profile) return;
    fetchLesson();
  }, [lessonId, user, profile]);

  useEffect(() => {
    const id = lesson?.cloudflare_asset_id;
    if (!id || !id.trim()) return;
    fetchPlaybackUrl(id.trim());
  }, [lesson?.cloudflare_asset_id]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      setCompleted(false);
      setPlaybackUrl(null);

      const [lessonRes, resourcesRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('lesson_resources').select('id, label, file_url, file_type').eq('lesson_id', lessonId).order('created_at'),
      ]);

      if (lessonRes.error) throw lessonRes.error;
      if (!lessonRes.data) throw new Error('Lesson not found');

      const l = { ...lessonRes.data, resources: (resourcesRes.data || []) as Resource[] } as LessonFull;
      setLesson(l);

      const [courseRes, outlineRes] = await Promise.all([
        supabase.from('courses').select('*').eq('id', l.course_id).single(),
        supabase.from('lessons')
          .select('id, title, is_preview, duration_seconds, lesson_order')
          .eq('course_id', l.course_id)
          .eq('is_published', true)
          .order('lesson_order'),
      ]);

      if (courseRes.data) setCourse(courseRes.data as Course);
      setOutline((outlineRes.data || []) as OutlineLesson[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybackUrl = async (assetId: string) => {
    setPlaybackLoading(true);
    try {
      const res = await fetch('/api/get-lesson-playback-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson?.id, cloudflareAssetId: assetId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.playbackUrl) { setPlaybackUrl(data.playbackUrl); return; }
      }
    } catch {}
    // Fallback: direct iframe URL
    const cfAccountId = import.meta.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID;
    if (cfAccountId && !cfAccountId.includes('placeholder')) {
      setPlaybackUrl(`https://customer-${cfAccountId}.cloudflarestream.com/${assetId}/iframe`);
    }
    setPlaybackLoading(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !lesson) return;
    try {
      setMarking(true);
      await supabase.from('access_audit').insert({
        actor_user_id: user.id,
        target_user_id: user.id,
        action_type: 'lesson_completed',
        resource_type: 'lesson',
        resource_id: lesson.id,
        payload: { lesson_title: lesson.title, course_id: lesson.course_id },
      });
    } catch {}
    setCompleted(true);
    const idx = outline.findIndex(l => l.id === lessonId);
    const next = outline[idx + 1];
    if (next) setTimeout(() => navigate(`/student/lesson/${next.id}`), 1000);
  };

  const currentIdx = outline.findIndex(l => l.id === lessonId);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < outline.length - 1;
  const hasVideo = !!(lesson?.cloudflare_asset_id?.trim());
  const hasText = !!(lesson?.body_content?.trim());
  const hasResources = (lesson?.resources?.length ?? 0) > 0;

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" />
          <p className="text-[#43474e] font-medium">Loading lesson...</p>
        </div>
      </main>
    </div>
  );

  // ── Not found ──────────────────────────────────────────────
  if (!lesson || !course) return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-[#ba1a1a] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#002045] mb-2">Lesson Not Found</h1>
          <p className="text-[#43474e] mb-6">We couldn't load this lesson. Please try again.</p>
          <Button variant="primary" onClick={() => navigate('/student')}>Back to Dashboard</Button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="pt-16">
        {error && (
          <div className="mx-auto max-w-[1280px] px-12 pt-6">
            <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ba1a1a] flex-shrink-0" />
              <p className="text-sm text-[#ba1a1a]">{error}</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1280px] px-12 py-8">
          <div className="grid grid-cols-12 gap-6">

            {/* ── Left sidebar: course outline ── */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-3"
            >
              <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden sticky top-24">
                <div className="bg-[#002045] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#62fae3]">
                    {course.title}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {outline.length} lesson{outline.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <nav className="divide-y divide-[#f3f4f7] max-h-[60vh] overflow-y-auto">
                  {outline.map((ol, idx) => {
                    const isActive = ol.id === lessonId;
                    return (
                      <button
                        key={ol.id}
                        onClick={() => navigate(`/student/lesson/${ol.id}`)}
                        className={`w-full text-left px-4 py-3 transition-all ${
                          isActive ? 'bg-[#006b5f] text-white' : 'hover:bg-[#f8f9ff]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#006b5f]'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight ${isActive ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {ol.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {ol.duration_seconds && (
                                <p className={`text-xs ${isActive ? 'text-[#62fae3]/80' : 'text-[#43474e]'}`}>
                                  {Math.round(ol.duration_seconds / 60)} min
                                </p>
                              )}
                              {ol.is_preview && (
                                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-[#62fae3]/30 text-[#007165]'
                                }`}>Preview</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                <div className="border-t border-[#c4c6cf] p-3">
                  <button
                    onClick={() => navigate('/student')}
                    className="w-full flex items-center justify-center gap-2 text-[#006b5f] border border-[#006b5f] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#eff4ff] transition-colors"
                  >
                    <BookOpen size={15} /> All Courses
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* ── Main content ── */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-9 space-y-6"
            >
              {/* Lesson title + meta */}
              <div>
                <div className="flex items-center gap-2 text-xs text-[#43474e] mb-2">
                  <span>{course.title}</span>
                  <ChevronRight size={12} />
                  <span className="text-[#002045] font-medium">Lesson {currentIdx + 1} of {outline.length}</span>
                </div>
                <h1 className="text-3xl font-bold text-[#002045]">{lesson.title}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {lesson.is_preview && (
                    <span className="px-2.5 py-1 bg-[#62fae3] text-[#007165] rounded-lg text-xs font-semibold uppercase tracking-wider">
                      Free Preview
                    </span>
                  )}
                  {lesson.duration_seconds && (
                    <div className="flex items-center gap-1 text-sm text-[#43474e]">
                      <Clock size={14} />
                      <span>{Math.round(lesson.duration_seconds / 60)} min</span>
                    </div>
                  )}
                  {hasVideo && (
                    <div className="flex items-center gap-1 text-sm text-[#43474e]">
                      <PlayCircle size={14} className="text-[#006b5f]" />
                      <span>Includes video</span>
                    </div>
                  )}
                  {hasResources && (
                    <div className="flex items-center gap-1 text-sm text-[#43474e]">
                      <File size={14} className="text-[#006b5f]" />
                      <span>{lesson.resources.length} resource{lesson.resources.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-[#43474e] mb-1">
                  <span>Course progress</span>
                  <span className="font-semibold text-[#006b5f]">
                    {outline.length > 0 ? Math.round(((currentIdx + 1) / outline.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#e0e2e8] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${outline.length > 0 ? ((currentIdx + 1) / outline.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-[#006b5f] rounded-full"
                  />
                </div>
              </div>

              {/* Video (only if it exists) */}
              {hasVideo && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg"
                >
                  {playbackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                      <Loader2 className="w-12 h-12 text-[#62fae3] animate-spin" />
                    </div>
                  )}
                  {playbackUrl ? (
                    <iframe
                      src={playbackUrl}
                      className="w-full h-full"
                      allow="accelerometer; gyroscope; picture-in-picture; clipboard-write"
                      allowFullScreen
                      title={lesson.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002045] to-[#006b5f] min-h-[240px]">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-[#62fae3] mx-auto mb-3" />
                        <p className="text-white/70 text-sm">Loading video...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Text content */}
              {hasText && (
                <motion.article
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: hasVideo ? 0.15 : 0 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-8"
                >
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#f3f4f7]">
                    <FileText size={16} className="text-[#006b5f]" />
                    <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">Lesson Notes</h2>
                  </div>
                  <div className="text-[#0b1c30] leading-relaxed whitespace-pre-wrap text-[15px]">
                    {lesson.body_content}
                  </div>
                </motion.article>
              )}

              {/* Resources */}
              {hasResources && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#f3f4f7]">
                    <Download size={16} className="text-[#006b5f]" />
                    <h2 className="text-sm font-bold text-[#002045] uppercase tracking-wide">
                      Resources & Downloads
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lesson.resources.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => window.open(r.file_url, '_blank', 'noopener,noreferrer')}
                        className="group flex items-center gap-3 p-4 bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#c4c6cf] hover:border-[#006b5f] rounded-xl transition-all text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#e0f3f0] flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-[#006b5f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#002045] truncate group-hover:text-[#006b5f] transition-colors">
                            {r.label}
                          </p>
                          {r.file_type && (
                            <p className="text-xs text-[#43474e] uppercase">{r.file_type}</p>
                          )}
                        </div>
                        <ExternalLink size={14} className="text-[#43474e] group-hover:text-[#006b5f] flex-shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty state when no content */}
              {!hasVideo && !hasText && !hasResources && (
                <div className="bg-white border border-dashed border-[#c4c6cf] rounded-xl p-16 text-center">
                  <BookOpen size={36} className="text-[#c4c6cf] mx-auto mb-3" />
                  <p className="text-[#002045] font-semibold">Content coming soon</p>
                  <p className="text-sm text-[#43474e] mt-1">The instructor hasn't added content to this lesson yet.</p>
                </div>
              )}

              {/* Navigation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 pt-2 border-t border-[#c4c6cf] flex-wrap"
              >
                {hasPrev && (
                  <Button variant="outline" onClick={() => navigate(`/student/lesson/${outline[currentIdx - 1].id}`)}>
                    <ChevronLeft size={17} /> Previous
                  </Button>
                )}

                <div className="flex-1" />

                <AnimatePresence mode="wait">
                  {!completed ? (
                    <motion.div key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button variant="primary" onClick={handleMarkComplete} loading={marking}>
                        <CheckSquare size={17} /> Mark Complete
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="done"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#e0f3f0] text-[#007165] rounded-lg font-medium text-sm"
                    >
                      <CheckCircle2 size={17} /> Completed!
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasNext && (
                  <Button variant={completed ? 'primary' : 'outline'} onClick={() => navigate(`/student/lesson/${outline[currentIdx + 1].id}`)}>
                    Next Lesson <ChevronRight size={17} />
                  </Button>
                )}
              </motion.div>

              {/* Up next teaser */}
              {hasNext && (
                <div className="flex items-center gap-3 p-4 bg-white border border-[#c4c6cf] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#f3f4f7] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#43474e]">{currentIdx + 2}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#43474e] font-medium uppercase tracking-wide">Up next</p>
                    <p className="text-sm font-semibold text-[#002045] truncate">{outline[currentIdx + 1]?.title}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/student/lesson/${outline[currentIdx + 1].id}`)}
                    className="flex items-center gap-1 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors flex-shrink-0"
                  >
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </motion.section>

          </div>
        </div>
      </main>
    </div>
  );
}
