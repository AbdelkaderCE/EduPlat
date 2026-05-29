import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Download, Clock, Play, CheckSquare, PlayCircle, FileText, Loader2, AlertCircle, } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
// ============================================================================
// MAIN COMPONENT: Multi-Media Learning Canvas
// ============================================================================
export default function LessonViewerRefined() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    // State Management
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [courseOutline, setCourseOutline] = useState([]);
    const [playbackUrl, setPlaybackUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playbackLoading, setPlaybackLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloadingResourceId, setDownloadingResourceId] = useState(null);
    // Lifecycle: Fetch lesson data
    useEffect(() => {
        if (!lessonId || !user || !profile)
            return;
        fetchLessonData();
    }, [lessonId, user, profile]);
    // Lifecycle: Fetch video playback URL when lesson has video
    useEffect(() => {
        if (!lesson?.cloudflare_asset_id || !user)
            return;
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
            if (lessonError)
                throw lessonError;
            if (!lessonData)
                throw new Error('Lesson not found');
            setLesson(lessonData);
            // Fetch parent course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', lessonData.course_id)
                .single();
            if (courseError)
                throw courseError;
            setCourse(courseData);
            // Fetch course outline (all lessons in course)
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('id, title, is_preview, duration_seconds')
                .eq('course_id', lessonData.course_id)
                .order('sequence_order', { ascending: true });
            if (lessonsError)
                throw lessonsError;
            setCourseOutline(lessonsData || []);
            // Fetch lesson resources
            const { data: resourcesData } = await supabase
                .from('lesson_resources')
                .select('id, storage_path, filename')
                .eq('lesson_id', lessonId);
            if (resourcesData) {
                setLesson((prev) => ({
                    ...prev,
                    resources: resourcesData,
                }));
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load lesson');
            console.error('Lesson fetch error:', err);
        }
        finally {
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
                    setPlaybackUrl(`https://customer-${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`);
                }
                return;
            }
            const result = (await response.json());
            if (result.success && result.playbackUrl) {
                setPlaybackUrl(result.playbackUrl);
            }
        }
        catch (err) {
            console.error('Playback URL error:', err);
            // Fallback to direct embed
            if (lesson?.cloudflare_asset_id) {
                setPlaybackUrl(`https://customer-${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${lesson.cloudflare_asset_id}/iframe`);
            }
        }
        finally {
            setPlaybackLoading(false);
        }
    };
    // =========================================================================
    // RESOURCE DOWNLOAD HANDLER
    // =========================================================================
    const handleResourceDownload = async (resourceId, storagePath, filename) => {
        try {
            setDownloadingResourceId(resourceId);
            // Generate signed URL from Supabase Storage
            const { data, error } = await supabase.storage
                .from('lesson-attachments')
                .createSignedUrl(storagePath, 3600); // 1 hour expiration
            if (error)
                throw error;
            if (!data?.signedUrl)
                throw new Error('Failed to generate download URL');
            // Trigger native download
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        catch (err) {
            console.error('Download error:', err);
            setError(err instanceof Error ? err.message : 'Download failed');
        }
        finally {
            setDownloadingResourceId(null);
        }
    };
    // =========================================================================
    // LOADING STATE
    // =========================================================================
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-16 flex items-center justify-center min-h-screen", children: _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center", children: [_jsx(Loader2, { className: "w-12 h-12 text-[#006b5f] animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium text-base", children: "Loading lesson..." })] }) })] }));
    }
    // =========================================================================
    // ERROR STATE
    // =========================================================================
    if (!lesson || !course) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-16 flex items-center justify-center min-h-screen", children: _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "text-center max-w-md px-4", children: [_jsx(AlertCircle, { className: "w-16 h-16 text-[#ba1a1a] mx-auto mb-4" }), _jsx("h1", { className: "text-2xl font-bold text-[#002045] mb-2", children: "Lesson Not Found" }), _jsx("p", { className: "text-[#43474e] mb-6", children: "We couldn't load this lesson. Please try again." }), _jsx(Button, { variant: "primary", onClick: () => navigate('/student'), children: "Back to Dashboard" })] }) })] }));
    }
    // =========================================================================
    // MAIN RENDER: 12-Column Layout
    // =========================================================================
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsxs("main", { className: "pt-16", children: [error && (_jsx(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mx-auto max-w-[1280px] px-12 py-6", children: _jsxs("div", { className: "bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-4 flex items-center gap-3", children: [_jsx(AlertCircle, { size: 20, className: "text-[#ba1a1a] flex-shrink-0" }), _jsx("p", { className: "text-sm text-[#ba1a1a]", children: error })] }) })), _jsx("div", { className: "mx-auto max-w-[1280px] px-12 py-8", children: _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsx(motion.aside, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5 }, className: "col-span-3", children: _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl overflow-hidden sticky top-24", children: [_jsx("div", { className: "bg-[#eff4ff] px-4 py-3 border-b border-[#c4c6cf]", children: _jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e]", children: course.title }) }), _jsx("nav", { className: "divide-y divide-[#c4c6cf]", children: courseOutline.map((outlineLesson, idx) => {
                                                    const isActive = outlineLesson.id === lesson.id;
                                                    const isCompleted = outlineLesson.completed || false;
                                                    return (_jsx(motion.button, { whileHover: { backgroundColor: isActive ? '#006b5f' : '#eff4ff' }, onClick: () => navigate(`/student/lesson/${outlineLesson.id}`), className: `w-full text-left px-4 py-3 transition-all duration-200 ${isActive
                                                            ? 'bg-[#006b5f] text-white'
                                                            : 'text-[#0b1c30] hover:bg-[#eff4ff]'}`, children: _jsxs("div", { className: "flex items-start gap-2", children: [isCompleted ? (_jsx(CheckSquare, { size: 18, className: `flex-shrink-0 mt-0.5 ${isActive ? 'text-[#62fae3]' : 'text-[#006b5f]'}` })) : (_jsx(PlayCircle, { size: 18, className: `flex-shrink-0 mt-0.5 ${isActive ? 'text-[#62fae3]' : 'text-[#43474e]'}` })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: `text-sm font-medium leading-tight truncate ${isActive ? 'text-white' : 'text-[#0b1c30]'}`, children: outlineLesson.title }), outlineLesson.duration_seconds && (_jsxs("p", { className: `text-xs mt-1 ${isActive ? 'text-[#62fae3]/80' : 'text-[#43474e]'}`, children: [Math.round(outlineLesson.duration_seconds / 60), " min"] }))] })] }) }, outlineLesson.id));
                                                }) }), _jsx("div", { className: "border-t border-[#c4c6cf] p-3", children: _jsxs("button", { className: "w-full flex items-center justify-center gap-2 bg-[#006b5f] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#005148] transition-all duration-200", children: [_jsx(Download, { size: 16 }), "Resources"] }) })] }) }), _jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "col-span-6 space-y-6", children: [lesson.cloudflare_asset_id && (_jsxs("div", { className: "relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg", children: [playbackLoading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10", children: _jsx(Loader2, { className: "w-12 h-12 text-[#62fae3] animate-spin" }) })), playbackUrl ? (_jsx("iframe", { src: playbackUrl, className: "w-full h-full", allow: "accelerometer; gyroscope; picture-in-picture; clipboard-write", allowFullScreen: true, title: lesson.title })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002045] to-[#006b5f]", children: _jsxs("div", { className: "text-center", children: [_jsx(Play, { className: "w-16 h-16 text-[#62fae3] mx-auto mb-4" }), _jsx("p", { className: "text-white text-sm", children: "Video player loading..." })] }) }))] })), _jsxs("div", { children: [_jsx(motion.h1, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 }, className: "text-3xl font-bold text-[#002045] font-title-lg", children: lesson.title }), _jsxs("div", { className: "flex items-center gap-3 mt-3", children: [lesson.is_preview && (_jsx("span", { className: "px-3 py-1 bg-[#62fae3] text-[#007165] rounded-lg text-xs font-semibold uppercase tracking-wider", children: "Preview" })), lesson.duration_seconds && (_jsxs("div", { className: "flex items-center gap-1 text-sm text-[#43474e]", children: [_jsx(Clock, { size: 16 }), _jsxs("span", { children: [Math.round(lesson.duration_seconds / 60), " minutes"] })] }))] })] }), lesson.body_content && (_jsx(motion.article, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, className: "bg-white border border-[#c4c6cf] rounded-xl p-8", children: _jsx("div", { className: "prose prose-sm max-w-none", children: _jsx("div", { className: "text-[#0b1c30] leading-relaxed whitespace-pre-wrap", children: lesson.body_content }) }) })), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, className: "flex items-center gap-3 pt-4", children: [_jsx(Button, { variant: "primary", children: "Mark Complete" }), _jsxs(Button, { variant: "outline", children: ["Next Lesson", _jsx(ChevronRight, { size: 18 })] })] })] }), _jsxs(motion.aside, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "col-span-3 space-y-6", children: [lesson.resources && lesson.resources.length > 0 && (_jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-4 font-title-lg", children: "Resources" }), _jsx("div", { className: "space-y-2", children: lesson.resources.map((resource) => (_jsxs(motion.button, { whileHover: { translateY: -2 }, whileTap: { scale: 0.98 }, onClick: () => handleResourceDownload(resource.id, resource.storage_path, resource.filename), disabled: downloadingResourceId === resource.id, className: "w-full flex items-center gap-3 p-3 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg border border-[#c4c6cf] transition-all duration-200 disabled:opacity-50", children: [_jsx(FileText, { size: 18, className: "text-[#006b5f] flex-shrink-0" }), _jsx("span", { className: "flex-1 text-left text-sm font-medium text-[#0b1c30] truncate", children: resource.filename }), downloadingResourceId === resource.id ? (_jsx(Loader2, { size: 16, className: "text-[#006b5f] animate-spin" })) : (_jsx(Download, { size: 16, className: "text-[#006b5f]" }))] }, resource.id))) })] })), _jsxs("div", { className: "bg-[#eff4ff] border border-[#c4c6cf] rounded-xl p-6", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-2", children: "Course" }), _jsx("p", { className: "text-lg font-semibold text-[#002045] font-title-lg", children: course.title }), _jsxs("button", { onClick: () => navigate('/student'), className: "mt-4 text-sm font-medium text-[#006b5f] hover:text-[#005148] transition-colors flex items-center gap-1", children: ["View Course ", _jsx(ChevronRight, { size: 16 })] })] }), _jsxs("div", { className: "bg-white border border-[#c4c6cf] rounded-xl p-6", children: [_jsx("h4", { className: "text-xs font-semibold uppercase tracking-wider text-[#43474e] mb-4", children: "Progress" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Lesson" }), _jsx("span", { className: "text-sm font-semibold text-[#006b5f]", children: "0%" })] }), _jsx("div", { className: "h-2 bg-[#c4c6cf] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full w-0 bg-[#006b5f]" }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Course" }), _jsx("span", { className: "text-sm font-semibold text-[#006b5f]", children: "65%" })] }), _jsx(motion.div, { initial: { width: 0 }, animate: { width: '65%' }, transition: { duration: 1 }, className: "h-2 bg-[#006b5f] rounded-full" })] })] })] })] })] }) })] })] }));
}
