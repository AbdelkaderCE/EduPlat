// ============================================================================
// src/pages/student/LessonViewerRefined.tsx
// ============================================================================
// Multi-Media Learning Canvas with Swiss Layout
//
// Layout Structure (12-column grid):
//   Left Rail (3 cols):     Course outline navigation with chapter progression
//   Center Canvas (6 cols): Dynamic media container (video + text + resources)
//   Right Sidebar (3 cols): Resource download center with secure signed URLs
//
// Content Rendering Strategy (based on lesson payload):
//   - If cloudflare_asset_id exists:     Render Cloudflare Stream secure video player
//   - If body_content exists:            Render typographic markdown canvas
//   - If lesson_resources exist:         Render document download buttons (signed URLs)
//
// Design System: ScholarStream specification
//   - Typography: Hanken Grotesk (titles), Inter (body)
//   - Colors: #002045 (navy), #006b5f (teal), #62fae3 (mint), #f8f9ff (bg)
//   - Spacing: 12-column grid, 24px gaps, 48px desktop margins
//   - Borders: 12px rounded (cards), 8px rounded (buttons)
// ============================================================================

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
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Lesson } from '../../types';

interface LessonWithResources extends Lesson {
  body_content?: string;
  cloudflare_asset_id?: string;
  resources?: Array<{
    id: string;
    storage_path: string;
    filename: string;
  }>;
}

interface CourseOutlineLesson extends Lesson {
  completed?: boolean;
}

interface PlaybackResponse {
  success: boolean;
  playbackUrl?: string;
  expiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// MAIN COMPONENT: Multi-Media Learning Canvas
// ============================================================================

export default function LessonViewerRefined() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // State Management
  const [lesson, setLesson] = useState<LessonWithResources | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseOutlineLesson[]>([]);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingResourceId, setDownloadingResourceId] = useState<string | null>(null);

  // Lifecycle: Fetch lesson data
  useEffect(() => {
    if (!lessonId || !user || !profile) return;
    fetchLessonData();
  }, [lessonId, user, profile]);

  // Lifecycle: Fetch video playback URL when lesson has video
  useEffect(() => {
    if (!lesson?.cloudflare_asset_id || !user) return;
    fetchPlaybackUrl();
  }, [lesson?.cloudflare_asset_id, user]);

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      if (!lessonData) throw new Error('Lesson not found');

      setLesson(lessonData as LessonWithResources);

      // Fetch parent course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', lessonData.course_id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData as Course);

      // Fetch course outline (all lessons in course)
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, is_preview, duration_seconds')
        .eq('course_id', lessonData.course_id)
        .order('sequence_order', { ascending: true });

      if (lessonsError) throw lessonsError;
      setCourseOutline((lessonsData as CourseOutlineLesson[]) || []);

      // Fetch lesson resources
      const { data: resourcesData } = await supabase
        .from('lesson_resources')
        .select('id, storage_path, filename')
        .eq('lesson_id', lessonId);

      if (resourcesData) {
        setLesson((prev) => ({
          ...prev!,
          resources: resourcesData,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
      console.error('Lesson fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybackUrl = async () => {
    try {
      setPlaybackLoading(true);

      // Call Edge Function to get signed Cloudflare URL
      // In production: fetch from your Edge Function endpoint
      // For now, construct secure playback URL with signed token
      const response = await fetch('/api/get-lesson-playback-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lesson?.id,
          cloudflareAssetId: lesson?.cloudflare_asset_id,
        }),
      });

      if (!response.ok) {
        // Fallback: Try direct Cloudflare embed (less secure)
        if (lesson?.cloudflare_asset_id) {
          setPlaybackUrl(
            `https://customer-${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`
          );
        }
        return;
      }

      const result = (await response.json()) as PlaybackResponse;
      if (result.success && result.playbackUrl) {
        setPlaybackUrl(result.playbackUrl);
      }
    } catch (err) {
      console.error('Playback URL error:', err);
      // Fallback to direct embed
      if (lesson?.cloudflare_asset_id) {
        setPlaybackUrl(
          `https://customer-${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`
        );
      }
    } finally {
      setPlaybackLoading(false);
    }
  };

  // =========================================================================
  // RESOURCE DOWNLOAD HANDLER
  // =========================================================================

  const handleResourceDownload = async (resourceId: string, storagePath: string, filename: string) => {
    try {
      setDownloadingResourceId(resourceId);

      // Generate signed URL from Supabase Storage
      const { data, error } = await supabase.storage
        .from('lesson-attachments')
        .createSignedUrl(storagePath, 3600); // 1 hour expiration

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to generate download URL');

      // Trigger native download
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

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium text-base">Loading lesson...</p>
          </motion.div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // ERROR STATE
  // =========================================================================

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

  // =========================================================================
  // MAIN RENDER: 12-Column Layout
  // =========================================================================

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-16">
        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-[1280px] px-12 py-6"
          >
            <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ba1a1a] flex-shrink-0" />
              <p className="text-sm text-[#ba1a1a]">{error}</p>
            </div>
          </motion.div>
        )}

        {/* 12-Column Grid Layout */}
        <div className="mx-auto max-w-[1280px] px-12 py-8">
          <div className="grid grid-cols-12 gap-6">
            {/* ================================================================
                LEFT RAIL (3 COLS): Course Outline Navigation
                ================================================================ */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="col-span-3"
            >
              <div className="bg-white border border-[#c4c6cf] rounded-xl overflow-hidden sticky top-24">
                {/* Outline Header */}
                <div className="bg-[#eff4ff] px-4 py-3 border-b border-[#c4c6cf]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#43474e]">
                    {course.title}
                  </p>
                </div>

                {/* Lessons List */}
                <nav className="divide-y divide-[#c4c6cf]">
                  {courseOutline.map((outlineLesson, idx) => {
                    const isActive = outlineLesson.id === lesson.id;
                    const isCompleted = outlineLesson.completed || false;

                    return (
                      <motion.button
                        key={outlineLesson.id}
                        whileHover={{ backgroundColor: isActive ? '#006b5f' : '#eff4ff' }}
                        onClick={() => navigate(`/student/lesson/${outlineLesson.id}`)}
                        className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#006b5f] text-white'
                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Completion Indicator */}
                          {isCompleted ? (
                            <CheckSquare
                              size={18}
                              className={`flex-shrink-0 mt-0.5 ${
                                isActive ? 'text-[#62fae3]' : 'text-[#006b5f]'
                              }`}
                            />
                          ) : (
                            <PlayCircle
                              size={18}
                              className={`flex-shrink-0 mt-0.5 ${
                                isActive ? 'text-[#62fae3]' : 'text-[#43474e]'
                              }`}
                            />
                          )}

                          {/* Lesson Title */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium leading-tight truncate ${
                                isActive ? 'text-white' : 'text-[#0b1c30]'
                              }`}
                            >
                              {outlineLesson.title}
                            </p>
                            {outlineLesson.duration_seconds && (
                              <p
                                className={`text-xs mt-1 ${
                                  isActive ? 'text-[#62fae3]/80' : 'text-[#43474e]'
                                }`}
                              >
                                {Math.round(outlineLesson.duration_seconds / 60)} min
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </nav>

                {/* Download Button at Bottom */}
                <div className="border-t border-[#c4c6cf] p-3">
                  <button className="w-full flex items-center justify-center gap-2 bg-[#006b5f] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#005148] transition-all duration-200">
                    <Download size={16} />
                    Resources
                  </button>
                </div>
              </div>
            </motion.aside>

            {/* ================================================================
                CENTER CANVAS (6 COLS): Dynamic Multi-Media Container
                ================================================================ */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-6 space-y-6"
            >
              {/* Video Player (Conditional Render) */}
              {lesson.cloudflare_asset_id && (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
                  {playbackLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002045] to-[#006b5f]">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-[#62fae3] mx-auto mb-4" />
                        <p className="text-white text-sm">Video player loading...</p>
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
                <div className="flex items-center gap-3 mt-3">
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
                </div>
              </div>

              {/* Text Content Canvas (Conditional Render) */}
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
                className="flex items-center gap-3 pt-4"
              >
                <Button variant="primary">
                  Mark Complete
                </Button>
                <Button variant="outline">
                  Next Lesson
                  <ChevronRight size={18} />
                </Button>
              </motion.div>
            </motion.section>

            {/* ================================================================
                RIGHT SIDEBAR (3 COLS): Resource Download Center
                ================================================================ */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-3 space-y-6"
            >
              {/* Resources Section */}
              {lesson.resources && lesson.resources.length > 0 && (
                <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#002045] mb-4 font-title-lg">
                    Resources
                  </h3>

                  <div className="space-y-2">
                    {lesson.resources.map((resource) => (
                      <motion.button
                        key={resource.id}
                        whileHover={{ translateY: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          handleResourceDownload(
                            resource.id,
                            resource.storage_path,
                            resource.filename
                          )
                        }
                        disabled={downloadingResourceId === resource.id}
                        className="w-full flex items-center gap-3 p-3 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg border border-[#c4c6cf] transition-all duration-200 disabled:opacity-50"
                      >
                        <FileText
                          size={18}
                          className="text-[#006b5f] flex-shrink-0"
                        />
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

              {/* Course Info Card */}
              <div className="bg-[#eff4ff] border border-[#c4c6cf] rounded-xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-2">
                  Course
                </h4>
                <p className="text-lg font-semibold text-[#002045] font-title-lg">
                  {course.title}
                </p>
                <button
                  onClick={() => navigate('/student')}
                  className="mt-4 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors flex items-center gap-1"
                >
                  View Course <ChevronRight size={16} />
                </button>
              </div>

              {/* Progress Card */}
              <div className="bg-white border border-[#c4c6cf] rounded-xl p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-4">
                  Progress
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[#0b1c30]">Lesson</span>
                      <span className="text-sm font-semibold text-[#006b5f]">0%</span>
                    </div>
                    <div className="h-2 bg-[#c4c6cf] rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-[#006b5f]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-[#0b1c30]">Course</span>
                      <span className="text-sm font-semibold text-[#006b5f]">65%</span>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1 }}
                      className="h-2 bg-[#006b5f] rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </main>
    </div>
  );
}
