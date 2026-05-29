import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Download,
  Clock,
  BookOpen,
  Play,
  CheckSquare,
  PlayCircle,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Lesson } from '../../types';

interface LessonWithResources extends Omit<Lesson, 'cloudflare_asset_id'> {
  body_content?: string;
  cloudflare_asset_id?: string;
  resources?: Array<{
    id: string;
    storage_path: string;
    filename: string;
  }>;
}

interface CourseOutlineLesson {
  id: string;
  title: string;
  is_preview: boolean;
  duration_seconds: number | null;
  lesson_order: number;
  completed?: boolean;
}

export default function LessonViewerRefined() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [lesson, setLesson] = useState<LessonWithResources | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseOutlineLesson[]>([]);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!lessonId || !user || !profile) return;
    fetchLessonData();
  }, [lessonId, user, profile]);

  useEffect(() => {
    if (!lesson?.cloudflare_asset_id || !user) return;
    fetchPlaybackUrl();
  }, [lesson?.cloudflare_asset_id]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError(null);
      setCompleted(false);
      setPlaybackUrl(null);

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      if (!lessonData) throw new Error('Lesson not found');

      setLesson(lessonData as LessonWithResources);

      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', lessonData.course_id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData as Course);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, is_preview, duration_seconds, lesson_order')
        .eq('course_id', lessonData.course_id)
        .order('lesson_order', { ascending: true });

      if (lessonsError) throw lessonsError;
      setCourseOutline((lessonsData as CourseOutlineLesson[]) || []);

      const { data: resourcesData } = await supabase
        .from('lesson_resources')
        .select('id, storage_path, filename')
        .eq('lesson_id', lessonId);

      if (resourcesData) {
        setLesson((prev) => prev ? { ...prev, resources: resourcesData } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
      console.error('Lesson fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybackUrl = async () => {
    if (!lesson?.cloudflare_asset_id) return;
    try {
      setPlaybackLoading(true);

      const response = await fetch('/api/get-lesson-playback-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson.id,
          cloudflareAssetId: lesson.cloudflare_asset_id,
        }),
      });

      if (!response.ok) {
        const cfAccountId = process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID;
        if (lesson.cloudflare_asset_id && cfAccountId && !cfAccountId.includes('placeholder')) {
          setPlaybackUrl(
            `https://customer-${cfAccountId}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`
          );
        }
        return;
      }

      const result = await response.json();
      if (result.success && result.playbackUrl) {
        setPlaybackUrl(result.playbackUrl);
      }
    } catch {
      const cfAccountId = process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID;
      if (lesson?.cloudflare_asset_id && cfAccountId && !cfAccountId.includes('placeholder')) {
        setPlaybackUrl(
          `https://customer-${cfAccountId}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`
        );
      }
    } finally {
      setPlaybackLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user || !lesson) return;
    try {
      setMarking(true);
      // Log to audit table so progress is tracked
      await supabase.from('access_audit').insert({
        actor_user_id: user.id,
        target_user_id: user.id,
        action_type: 'lesson_completed',
        resource_type: 'lesson',
        resource_id: lesson.id,
        payload: { lesson_title: lesson.title, course_id: lesson.course_id },
      });
      setCompleted(true);

      // Auto-advance to next lesson after a short delay
      const currentIdx = courseOutline.findIndex((l) => l.id === lessonId);
      const nextLesson = courseOutline[currentIdx + 1];
      if (nextLesson) {
        setTimeout(() => navigate(`/student/lesson/${nextLesson.id}`), 1200);
      }
    } catch (err) {
      console.error('Failed to mark complete:', err);
      setCompleted(true); // Still mark UI complete even if audit log fails
    } finally {
      setMarking(false);
    }
  };

  const handleNextLesson = () => {
    const currentIdx = courseOutline.findIndex((l) => l.id === lessonId);
    const nextLesson = courseOutline[currentIdx + 1];
    if (nextLesson) navigate(`/student/lesson/${nextLesson.id}`);
  };

  const handlePrevLesson = () => {
    const currentIdx = courseOutline.findIndex((l) => l.id === lessonId);
    const prevLesson = courseOutline[currentIdx - 1];
    if (prevLesson) navigate(`/student/lesson/${prevLesson.id}`);
  };

  const handleResourceDownload = async (resourceId: string, storagePath: string, filename: string) => {
    try {
      setDownloadingResourceId(resourceId);
      const { data, error } = await supabase.storage
        .from('lesson-attachments')
        .createSignedUrl(storagePath, 3600);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate download URL');

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingResourceId(null);
    }
  };

  const currentIdx = courseOutline.findIndex((l) => l.id === lessonId);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx >= 0 && currentIdx < courseOutline.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Loader2 className="w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium text-base">Loading lesson...</p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md px-4"
          >
            <AlertCircle className="w-16 h-16 text-[#ba1a1a] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#002045] mb-2">Lesson Not Found</h1>
            <p className="text-[#43474e] mb-6">We couldn't load this lesson. Please try again.</p>
            <Button variant="primary" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-16">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-[1280px] px-12 pt-6"
          >
            <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ba1a1a] flex-shrink-0" />
              <p className="text-sm text-[#ba1a1a]">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="mx-auto max-w-[1280px] px-12 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT RAIL (3 COLS): Course Outline */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="col-span-3"
            >
              <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden sticky top-24">
                <div className="bg-[#eff4ff] px-4 py-3 border-b border-[#c4c6cf]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e] truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-[#74777f] mt-0.5">
                    {courseOutline.length} lesson{courseOutline.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <nav className="divide-y divide-[#c4c6cf] max-h-[60vh] overflow-y-auto">
                  {courseOutline.map((outlineLesson, idx) => {
                    const isActive = outlineLesson.id === lessonId;
                    return (
                      <button
                        key={outlineLesson.id}
                        onClick={() => navigate(`/student/lesson/${outlineLesson.id}`)}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                          isActive ? 'bg-[#006b5f] text-white' : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[#eff4ff] text-[#006b5f]'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight truncate ${isActive ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {outlineLesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {outlineLesson.duration_seconds && (
                                <p className={`text-xs ${isActive ? 'text-[#62fae3]/80' : 'text-[#43474e]'}`}>
                                  {Math.round(outlineLesson.duration_seconds / 60)} min
                                </p>
                              )}
                              {outlineLesson.is_preview && (
                                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-[#62fae3]/30 text-[#007165]'}`}>
                                  Preview
                                </span>
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
                    <BookOpen size={16} />
                    All Courses
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* CENTER CANVAS (6 COLS) */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-6 space-y-6"
            >
              {/* Video Player */}
              {lesson.cloudflare_asset_id && (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002045] to-[#006b5f] min-h-[200px]">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-[#62fae3] mx-auto mb-4" />
                        <p className="text-white text-sm opacity-80">Video player loading...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Title & Meta */}
              <div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold text-[#002045] font-title-lg"
                >
                  {lesson.title}
                </motion.h1>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {lesson.is_preview && (
                    <span className="px-3 py-1 bg-[#62fae3] text-[#007165] rounded-lg text-xs font-semibold uppercase tracking-wider">
                      Preview
                    </span>
                  )}
                  {lesson.duration_seconds && (
                    <div className="flex items-center gap-1 text-sm text-[#43474e]">
                      <Clock size={16} />
                      <span>{Math.round(lesson.duration_seconds / 60)} minutes</span>
                    </div>
                  )}
                  {currentIdx >= 0 && (
                    <span className="text-sm text-[#43474e]">
                      Lesson {currentIdx + 1} of {courseOutline.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Text Content */}
              {lesson.body_content && (
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-[#c4c6cf] rounded-xl p-8"
                >
                  <div className="prose prose-sm max-w-none">
                    <div className="text-[#0b1c30] leading-relaxed whitespace-pre-wrap">
                      {lesson.body_content}
                    </div>
                  </div>
                </motion.article>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 pt-2 flex-wrap"
              >
                {hasPrev && (
                  <Button variant="outline" onClick={handlePrevLesson}>
                    <ChevronLeft size={18} />
                    Previous
                  </Button>
                )}

                {!completed ? (
                  <Button variant="primary" onClick={handleMarkComplete} loading={marking}>
                    <CheckSquare size={18} />
                    Mark Complete
                  </Button>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#e0f3f0] text-[#007165] rounded-lg font-medium text-sm"
                  >
                    <CheckCircle2 size={18} />
                    Completed!
                  </motion.div>
                )}

                {hasNext && (
                  <Button variant={completed ? 'primary' : 'outline'} onClick={handleNextLesson}>
                    Next Lesson
                    <ChevronRight size={18} />
                  </Button>
                )}
              </motion.div>
            </motion.section>

            {/* RIGHT SIDEBAR (3 COLS) */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-3 space-y-6"
            >
              {/* Resources */}
              {lesson.resources && lesson.resources.length > 0 && (
                <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-[#002045] mb-4 font-title-lg flex items-center gap-2">
                    <Download size={16} className="text-[#006b5f]" />
                    Lesson Resources
                  </h3>
                  <div className="space-y-2">
                    {lesson.resources.map((resource) => (
                      <motion.button
                        key={resource.id}
                        whileHover={{ translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleResourceDownload(resource.id, resource.storage_path, resource.filename)}
                        disabled={downloadingResourceId === resource.id}
                        className="w-full flex items-center gap-3 p-3 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg border border-[#c4c6cf] transition-all duration-200 disabled:opacity-50"
                      >
                        <FileText size={18} className="text-[#006b5f] flex-shrink-0" />
                        <span className="flex-1 text-left text-sm font-medium text-[#0b1c30] truncate">
                          {resource.filename}
                        </span>
                        {downloadingResourceId === resource.id ? (
                          <Loader2 size={16} className="text-[#006b5f] animate-spin" />
                        ) : (
                          <Download size={16} className="text-[#006b5f]" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Info */}
              <div className="bg-[#eff4ff] border border-[#c4c6cf] rounded-xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-2">
                  Course
                </h4>
                <p className="text-base font-semibold text-[#002045] font-title-lg leading-tight">
                  {course.title}
                </p>
                <button
                  onClick={() => navigate('/student')}
                  className="mt-4 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors flex items-center gap-1"
                >
                  All Courses <ChevronRight size={16} />
                </button>
              </div>

              {/* Progress in Course */}
              <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-4">
                  Course Progress
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#0b1c30]">
                      Lesson {currentIdx + 1} / {courseOutline.length}
                    </span>
                    <span className="font-semibold text-[#006b5f]">
                      {courseOutline.length > 0 ? Math.round(((currentIdx + 1) / courseOutline.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#c4c6cf] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${courseOutline.length > 0 ? ((currentIdx + 1) / courseOutline.length) * 100 : 0}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full bg-[#006b5f] rounded-full"
                    />
                  </div>
                </div>

                {hasNext && (
                  <div className="mt-4 pt-4 border-t border-[#c4c6cf]">
                    <p className="text-xs text-[#43474e] mb-1">Up next</p>
                    <p className="text-sm font-medium text-[#0b1c30] truncate">
                      {courseOutline[currentIdx + 1]?.title}
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}
