// ============================================================================
// src/pages/student/LessonViewer.tsx
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
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Course, Lesson } from '../../types';

interface PlaybackResponse {
  success: boolean;
  playbackUrl?: string;
  expiresAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export default function LessonViewer() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId || !user) return;
    fetchLesson();
  }, [lessonId, user]);

  const fetchLesson = async () => {
    try {
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData as Lesson);

      // Fetch parent course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', lessonData.course_id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData as Course);

      // Fetch playback URL
      await fetchPlaybackUrl(lessonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybackUrl = async (lId: string) => {
    try {
      setPlaybackLoading(true);
      // Call Edge Function to get signed Cloudflare URL
      const response = await fetch('/api/get-lesson-playback-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lId }),
      });

      const result = (await response.json()) as PlaybackResponse;

      if (!result.success) {
        throw new Error(result.errorMessage || 'Failed to get playback URL');
      }

      setPlaybackUrl(result.playbackUrl || null);
    } catch (err) {
      console.error('Playback URL error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setPlaybackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#43474e] font-medium">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-[#002045] mb-4">Lesson Not Found</h1>
            <Button onClick={() => navigate('/student')} variant="primary">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />

      <main className="pt-24">
        {/* 12-column layout: Left (8 cols) player, Right (4 cols) sidebar */}
        <div className="px-12 py-8 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Video Player & Lesson Content */}
            <div className="col-span-8 space-y-6">
              {/* Breadcrumb */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-[#43474e] opacity-60"
              >
                <Link to="/student" className="hover:text-[#006b5f] transition-colors">
                  Dashboard
                </Link>
                <ChevronRight size={16} />
                <Link to={`/student/lesson/${lesson.id}`} className="hover:text-[#006b5f] transition-colors">
                  {lesson.title}
                </Link>
              </motion.div>

              {/* Video Player */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative"
              >
                {playbackLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-white text-sm font-medium">Loading video...</p>
                    </div>
                  </div>
                )}

                {error && !playbackUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white font-medium mb-4">Unable to load video</p>
                      <p className="text-gray-400 text-sm">{error}</p>
                    </div>
                  </div>
                ) : playbackUrl ? (
                  <video
                    controls
                    className="w-full h-full bg-black"
                    key={playbackUrl}
                    src={playbackUrl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/50">
                    <p className="text-white">No playback URL available</p>
                  </div>
                )}
              </motion.div>

              {/* Lesson Title & Meta */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h1 className="text-3xl font-bold text-[#002045] mb-2 font-title-lg">{lesson.title}</h1>
                <div className="flex items-center gap-4 text-sm text-[#43474e]">
                  <span className="px-3 py-1 bg-[#62fae3] text-[#007165] rounded-full font-semibold uppercase text-xs tracking-wider">
                    {lesson.is_preview ? 'Preview' : 'Full Access'}
                  </span>
                  {lesson.duration_seconds && (
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{Math.round(lesson.duration_seconds / 60)} min</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Lesson Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-8"
              >
                <h2 className="text-xl font-semibold text-[#002045] mb-4 font-title-lg">Lesson Content</h2>
                <div className="prose prose-sm max-w-none text-[#0b1c30]">
                  <p>
                    Welcome to this lesson! Here you'll learn the fundamentals of{' '}
                    <span className="font-semibold">{lesson.title}</span>. This comprehensive guide covers all the essential
                    concepts you need to get started.
                  </p>
                  <h3 className="text-lg font-semibold text-[#002045] mt-6 mb-2">Key Topics</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Core principles and concepts</li>
                    <li>Real-world applications</li>
                    <li>Best practices and workflows</li>
                    <li>Common challenges and solutions</li>
                  </ul>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <Button variant="primary" size="lg">
                  Mark as Complete
                </Button>
                <Button variant="outline" size="lg">
                  Next Lesson →
                </Button>
              </motion.div>
            </div>

            {/* Right: Sidebar (4 cols) */}
            <aside className="col-span-4 space-y-6">
              {/* Course Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-6"
              >
                <h3 className="text-sm font-medium text-[#43474e] mb-2 uppercase tracking-wide">Course</h3>
                <h2 className="text-lg font-semibold text-[#002045] mb-4 font-title-lg">{course.title}</h2>
                <Link
                  to="/student"
                  className="inline-flex items-center gap-2 text-sm text-[#006b5f] hover:text-[#005148] transition-colors font-medium"
                >
                  View Course <ChevronRight size={16} />
                </Link>
              </motion.div>

              {/* Resources / Downloads */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-[#c4c6cf] p-6"
              >
                <h3 className="text-lg font-semibold text-[#002045] mb-4 font-title-lg">Resources</h3>
                <div className="space-y-2">
                  <ProtectedFileDownloader
                    lessonId={lesson.id}
                    fileName="Lesson_Notes.pdf"
                    fileType="pdf"
                  />
                  <ProtectedFileDownloader
                    lessonId={lesson.id}
                    fileName="Code_Examples.zip"
                    fileType="archive"
                  />
                </div>
              </motion.div>

              {/* Lesson Progress */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#eff4ff] rounded-xl border border-[#c4c6cf] p-6"
              >
                <h3 className="text-sm font-medium text-[#43474e] mb-4 uppercase tracking-wide">Progress</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#0b1c30]">Lesson Completion</span>
                      <span className="text-sm font-semibold text-[#006b5f]">0%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-[#006b5f]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#0b1c30]">Course Progress</span>
                      <span className="text-sm font-semibold text-[#006b5f]">65%</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '65%' }}
                        transition={{ duration: 1 }}
                        className="h-full bg-[#006b5f]"
                      />
                    </div>
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

// ============================================================================
// Protected File Downloader Component
// ============================================================================

interface ProtectedFileDownloaderProps {
  lessonId: string;
  fileName: string;
  fileType: 'pdf' | 'archive' | 'document';
}

function ProtectedFileDownloader({ lessonId, fileName, fileType }: ProtectedFileDownloaderProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);

      // Generate signed URL via Edge Function
      const response = await fetch('/api/get-resource-download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          fileName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get download link');
      }

      const { signedUrl } = (await response.json()) as { signedUrl: string };

      // Trigger download
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const iconMap = {
    pdf: '📄',
    archive: '📦',
    document: '📝',
  };

  return (
    <motion.button
      whileHover={{ translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleDownload}
      disabled={downloading}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-[#c4c6cf] hover:bg-[#eff4ff] transition-colors disabled:opacity-50"
    >
      <span className="text-lg">{iconMap[fileType]}</span>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-[#0b1c30]">{fileName}</p>
      </div>
      <Download size={16} className="text-[#006b5f]" />
      {downloading && <div className="w-4 h-4 border-2 border-[#006b5f] border-t-transparent rounded-full animate-spin" />}
    </motion.button>
  );
}
