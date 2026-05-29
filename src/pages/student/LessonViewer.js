import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Download, Clock, } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/shared/Button';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
export default function LessonViewer() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [playbackUrl, setPlaybackUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playbackLoading, setPlaybackLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!lessonId || !user)
            return;
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
            if (lessonError)
                throw lessonError;
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
            // Fetch playback URL
            await fetchPlaybackUrl(lessonId);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load lesson');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPlaybackUrl = async (lId) => {
        try {
            setPlaybackLoading(true);
            // Call Edge Function to get signed Cloudflare URL
            const response = await fetch('/api/get-lesson-playback-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: lId }),
            });
            const result = (await response.json());
            if (!result.success) {
                throw new Error(result.errorMessage || 'Failed to get playback URL');
            }
            setPlaybackUrl(result.playbackUrl || null);
        }
        catch (err) {
            console.error('Playback URL error:', err);
            setError(err instanceof Error ? err.message : 'Failed to load video');
        }
        finally {
            setPlaybackLoading(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-[#43474e] font-medium", children: "Loading lesson..." })] }) })] }));
    }
    if (!lesson || !course) {
        return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("div", { className: "pt-24 flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("h1", { className: "text-2xl font-bold text-[#002045] mb-4", children: "Lesson Not Found" }), _jsx(Button, { onClick: () => navigate('/student'), variant: "primary", children: "Back to Dashboard" })] }) })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#f8f9ff]", children: [_jsx(Header, {}), _jsx("main", { className: "pt-24", children: _jsx("div", { className: "px-12 py-8 max-w-[1280px] mx-auto", children: _jsxs("div", { className: "grid grid-cols-12 gap-6", children: [_jsxs("div", { className: "col-span-8 space-y-6", children: [_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "flex items-center gap-2 text-sm text-[#43474e] opacity-60", children: [_jsx(Link, { to: "/student", className: "hover:text-[#006b5f] transition-colors", children: "Dashboard" }), _jsx(ChevronRight, { size: 16 }), _jsx(Link, { to: `/student/lesson/${lesson.id}`, className: "hover:text-[#006b5f] transition-colors", children: lesson.title })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative", children: [playbackLoading && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-white text-sm font-medium", children: "Loading video..." })] }) })), error && !playbackUrl ? (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-white font-medium mb-4", children: "Unable to load video" }), _jsx("p", { className: "text-gray-400 text-sm", children: error })] }) })) : playbackUrl ? (_jsx("video", { controls: true, className: "w-full h-full bg-black", src: playbackUrl }, playbackUrl)) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-black/50", children: _jsx("p", { className: "text-white", children: "No playback URL available" }) }))] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.1 }, children: [_jsx("h1", { className: "text-3xl font-bold text-[#002045] mb-2 font-title-lg", children: lesson.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-[#43474e]", children: [_jsx("span", { className: "px-3 py-1 bg-[#62fae3] text-[#007165] rounded-full font-semibold uppercase text-xs tracking-wider", children: lesson.is_preview ? 'Preview' : 'Full Access' }), lesson.duration_seconds && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 16 }), _jsxs("span", { children: [Math.round(lesson.duration_seconds / 60), " min"] })] }))] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-8", children: [_jsx("h2", { className: "text-xl font-semibold text-[#002045] mb-4 font-title-lg", children: "Lesson Content" }), _jsxs("div", { className: "prose prose-sm max-w-none text-[#0b1c30]", children: [_jsxs("p", { children: ["Welcome to this lesson! Here you'll learn the fundamentals of", ' ', _jsx("span", { className: "font-semibold", children: lesson.title }), ". This comprehensive guide covers all the essential concepts you need to get started."] }), _jsx("h3", { className: "text-lg font-semibold text-[#002045] mt-6 mb-2", children: "Key Topics" }), _jsxs("ul", { className: "space-y-2 list-disc list-inside", children: [_jsx("li", { children: "Core principles and concepts" }), _jsx("li", { children: "Real-world applications" }), _jsx("li", { children: "Best practices and workflows" }), _jsx("li", { children: "Common challenges and solutions" })] })] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.3 }, className: "flex items-center gap-4", children: [_jsx(Button, { variant: "primary", size: "lg", children: "Mark as Complete" }), _jsx(Button, { variant: "outline", size: "lg", children: "Next Lesson \u2192" })] })] }), _jsxs("aside", { className: "col-span-4 space-y-6", children: [_jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.1 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-6", children: [_jsx("h3", { className: "text-sm font-medium text-[#43474e] mb-2 uppercase tracking-wide", children: "Course" }), _jsx("h2", { className: "text-lg font-semibold text-[#002045] mb-4 font-title-lg", children: course.title }), _jsxs(Link, { to: "/student", className: "inline-flex items-center gap-2 text-sm text-[#006b5f] hover:text-[#005148] transition-colors font-medium", children: ["View Course ", _jsx(ChevronRight, { size: 16 })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.2 }, className: "bg-white rounded-xl border border-[#c4c6cf] p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-[#002045] mb-4 font-title-lg", children: "Resources" }), _jsxs("div", { className: "space-y-2", children: [_jsx(ProtectedFileDownloader, { lessonId: lesson.id, fileName: "Lesson_Notes.pdf", fileType: "pdf" }), _jsx(ProtectedFileDownloader, { lessonId: lesson.id, fileName: "Code_Examples.zip", fileType: "archive" })] })] }), _jsxs(motion.div, { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.5, delay: 0.3 }, className: "bg-[#eff4ff] rounded-xl border border-[#c4c6cf] p-6", children: [_jsx("h3", { className: "text-sm font-medium text-[#43474e] mb-4 uppercase tracking-wide", children: "Progress" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Lesson Completion" }), _jsx("span", { className: "text-sm font-semibold text-[#006b5f]", children: "0%" })] }), _jsx("div", { className: "h-2 bg-white rounded-full overflow-hidden", children: _jsx("div", { className: "h-full w-0 bg-[#006b5f]" }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-[#0b1c30]", children: "Course Progress" }), _jsx("span", { className: "text-sm font-semibold text-[#006b5f]", children: "65%" })] }), _jsx("div", { className: "h-2 bg-white rounded-full overflow-hidden", children: _jsx(motion.div, { initial: { width: 0 }, animate: { width: '65%' }, transition: { duration: 1 }, className: "h-full bg-[#006b5f]" }) })] })] })] })] })] }) }) })] }));
}
function ProtectedFileDownloader({ lessonId, fileName, fileType }) {
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);
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
            const { signedUrl } = (await response.json());
            // Trigger download
            const link = document.createElement('a');
            link.href = signedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        }
        finally {
            setDownloading(false);
        }
    };
    const iconMap = {
        pdf: '📄',
        archive: '📦',
        document: '📝',
    };
    return (_jsxs(motion.button, { whileHover: { translateY: -2 }, whileTap: { scale: 0.98 }, onClick: handleDownload, disabled: downloading, className: "w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-[#c4c6cf] hover:bg-[#eff4ff] transition-colors disabled:opacity-50", children: [_jsx("span", { className: "text-lg", children: iconMap[fileType] }), _jsx("div", { className: "flex-1 text-left", children: _jsx("p", { className: "text-sm font-medium text-[#0b1c30]", children: fileName }) }), _jsx(Download, { size: 16, className: "text-[#006b5f]" }), downloading && _jsx("div", { className: "w-4 h-4 border-2 border-[#006b5f] border-t-transparent rounded-full animate-spin" })] }));
}
