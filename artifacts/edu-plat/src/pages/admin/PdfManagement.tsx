// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Download, Users, BookOpen, AlertCircle, CheckCircle2, Trash2, Link2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabaseClient';
import { Lesson, Course } from '../../types';

interface WmPdf {
  id: number;
  filename: string;
  lessonId: string | null;
  uploadedAt: string;
}

interface DownloadEntry {
  id: number;
  username: string;
  serialNumber: string | null;
  filename: string;
  lessonId: string | null;
  downloadedAt: string;
}

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export default function PdfManagement() {
  const { profile } = useAuth();
  const [pdfs, setPdfs] = useState<WmPdf[]>([]);
  const [history, setHistory] = useState<DownloadEntry[]>([]);
  const [lessons, setLessons] = useState<(Lesson & { courseTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLesson, setUploadLesson] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pdfsData, historyData] = await Promise.all([
        apiGet<WmPdf[]>('/api/edu/admin/pdfs'),
        apiGet<DownloadEntry[]>('/api/edu/admin/history'),
      ]);

      const [coursesRes, lessonsRes] = await Promise.all([
        supabase.from('courses').select('id, title').order('title'),
        supabase.from('lessons').select('*').order('title'),
      ]);

      const courseMap: Record<string, string> = {};
      (coursesRes.data || []).forEach((c: Course) => { courseMap[c.id] = c.title; });

      const enrichedLessons = (lessonsRes.data || []).map((l: Lesson) => ({
        ...l,
        courseTitle: courseMap[l.course_id] || 'Unknown Course',
      }));

      setPdfs(pdfsData);
      setHistory(historyData);
      setLessons(enrichedLessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const token = await getToken();
      const form = new FormData();
      form.append('file', uploadFile);
      if (uploadLesson) form.append('lessonId', uploadLesson);

      const res = await fetch('/api/edu/admin/pdfs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      setUploadSuccess(`"${uploadFile.name}" uploaded successfully.`);
      setUploadFile(null);
      setUploadLesson('');
      if (fileRef.current) fileRef.current.value = '';
      await fetchAll();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const lessonName = (lessonId: string | null) => {
    if (!lessonId) return '—';
    const l = lessons.find(l => l.id === lessonId);
    return l ? `${l.courseTitle} › ${l.title}` : lessonId;
  };

  const uniqueStudents = new Set(history.map(h => h.username)).size;

  const statCards = [
    { label: 'PDFs Uploaded', value: pdfs.length, icon: FileText, color: '#006b5f' },
    { label: 'Total Downloads', value: history.length, icon: Download, color: '#002045' },
    { label: 'Students Tracked', value: uniqueStudents, icon: Users, color: '#007165' },
    { label: 'Lessons Linked', value: pdfs.filter(p => p.lessonId).length, icon: Link2, color: '#43474e' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-[#002045] font-title-lg">PDF Management</h1>
          <p className="text-[#43474e] mt-1">Upload watermarked PDFs and track every student download</p>
        </motion.div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-[#ffdad6] border border-[#ba1a1a] text-[#ba1a1a] rounded-xl px-4 py-3">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-[#c4c6cf] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#43474e]">{s.label}</span>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div className="text-3xl font-bold font-title-lg" style={{ color: s.color }}>
                {loading ? '—' : s.value}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-[#c4c6cf] p-6"
          >
            <h2 className="text-lg font-semibold text-[#002045] font-title mb-4 flex items-center gap-2">
              <Upload size={18} className="text-[#006b5f]" /> Upload PDF
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#43474e] mb-1">PDF File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[#43474e] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#eff4ff] file:text-[#006b5f] hover:file:bg-[#dce9ff] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#43474e] mb-1">Link to Lesson (optional)</label>
                <select
                  value={uploadLesson}
                  onChange={e => setUploadLesson(e.target.value)}
                  className="w-full border border-[#c4c6cf] rounded-xl px-3 py-2 text-sm text-[#0b1c30] bg-white focus:outline-none focus:ring-2 focus:ring-[#006b5f]"
                >
                  <option value="">— No lesson —</option>
                  {lessons.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.courseTitle} › {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {uploadSuccess && (
                <div className="flex items-center gap-2 text-[#006b5f] text-sm bg-[#eff4ff] rounded-xl px-3 py-2">
                  <CheckCircle2 size={16} /> {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="flex items-center gap-2 text-[#ba1a1a] text-sm bg-[#ffdad6] rounded-xl px-3 py-2">
                  <AlertCircle size={16} /> {uploadError}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="w-full bg-[#006b5f] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#007165] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={15} /> Upload PDF</>
                )}
              </button>
            </div>
          </motion.div>

          {/* PDF library */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-[#c4c6cf] p-6"
          >
            <h2 className="text-lg font-semibold text-[#002045] font-title mb-4 flex items-center gap-2">
              <FileText size={18} className="text-[#006b5f]" /> PDF Library
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin" />
              </div>
            ) : pdfs.length === 0 ? (
              <div className="text-center py-12 text-[#43474e] text-sm">No PDFs uploaded yet.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {pdfs.map(pdf => (
                  <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#c4c6cf] hover:bg-[#f8f9ff] transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#eff4ff] flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-[#006b5f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0b1c30] truncate">{pdf.filename}</p>
                      <p className="text-xs text-[#43474e] truncate flex items-center gap-1 mt-0.5">
                        <BookOpen size={11} /> {lessonName(pdf.lessonId)}
                      </p>
                    </div>
                    <div className="text-xs text-[#74777f] whitespace-nowrap">
                      {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Download history */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#c4c6cf] p-6"
        >
          <h2 className="text-lg font-semibold text-[#002045] font-title mb-4 flex items-center gap-2">
            <Download size={18} className="text-[#006b5f]" /> Download History
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-[#006b5f] border-t-[#62fae3] rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-[#43474e] text-sm">No downloads yet. Upload a PDF and link it to a lesson to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#c4c6cf]">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#74777f] uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#74777f] uppercase tracking-wide">Serial #</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#74777f] uppercase tracking-wide">PDF</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#74777f] uppercase tracking-wide">Lesson</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-[#74777f] uppercase tracking-wide">Downloaded</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id} className={`border-b border-[#f0f0f0] hover:bg-[#f8f9ff] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                      <td className="py-3 px-2">
                        <span className="font-medium text-[#002045]">{h.username}</span>
                      </td>
                      <td className="py-3 px-2">
                        {h.serialNumber ? (
                          <span className="font-mono text-xs bg-[#dce9ff] text-[#002045] px-2 py-1 rounded-lg">{h.serialNumber}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-2 text-[#43474e] truncate max-w-[160px]">{h.filename}</td>
                      <td className="py-3 px-2 text-[#43474e] truncate max-w-[180px]">{lessonName(h.lessonId)}</td>
                      <td className="py-3 px-2 text-[#74777f] whitespace-nowrap">
                        {new Date(h.downloadedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
