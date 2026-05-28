# Multi-Media Learning Canvas - Architecture & Strategy

## 🎯 Overview

The **Multi-Media Learning Canvas** is the flagship innovation of EduPlat's frontend. It's a unified, dynamic layout that intelligently adapts to lesson content types, enabling seamless integration of videos, text, and downloadable resources within a single, consistent user experience.

---

## 📐 Layout Architecture

### 12-Column Swiss Grid Structure

```
┌────────────────────────────────────────────────────────────────┐
│                      Fixed Header (64px)                        │
├────────┬──────────────────────────┬───────────────────────────┤
│        │                          │                           │
│ 3 cols │      6 cols              │       3 cols              │
│        │                          │                           │
│ RAIL   │   CENTER CANVAS          │   SIDEBAR                │
│        │                          │                           │
│ OUTLINE│   • Video Player         │   • Resources             │
│        │   • Title & Meta         │   • Course Info           │
│        │   • Text Content         │   • Progress              │
│        │   • Actions              │                           │
│        │                          │                           │
└────────┴──────────────────────────┴───────────────────────────┘
```

### Spacing Configuration
- **Container Max:** 1280px (max-w-[1280px])
- **Desktop Margins:** 48px (px-12)
- **Grid Gaps:** 24px (gap-6)
- **Card Padding:** 24px (p-6)
- **Border Radius:** 12px (rounded-xl) for cards, 8px (rounded-lg) for buttons

---

## 🎬 Dynamic Content Rendering Strategy

The lesson viewer detects content type and renders appropriate components:

### 1. Video Player Module (if `lesson.cloudflare_asset_id` exists)

```typescript
// Conditional Render
{lesson.cloudflare_asset_id && (
  <div class="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
    {playbackLoading && <LoadingSpinner />}
    {playbackUrl ? (
      <iframe src={playbackUrl} allow="..." />
    ) : (
      <PlayIconOverlay />
    )}
  </div>
)}
```

**Features:**
- 16:9 aspect ratio (aspect-video)
- Secure iframe from signed URL
- Loading spinner overlay during fetch
- Fallback to direct Cloudflare embed if Edge Function fails
- Black background for theater mode

**Cloudflare Integration:**
```typescript
// Data Flow
1. Component mounts with lesson.cloudflare_asset_id
2. useEffect triggers fetchPlaybackUrl()
3. Calls Edge Function: POST /api/get-lesson-playback-url
4. Edge Function generates signed HLS manifest URL
5. Returns iframe URL (never raw token)
6. Component renders iframe
```

**Security Model:**
- Never exposes raw Cloudflare token to client
- Uses signed, time-limited URLs from Edge Function
- Each video playback requires fresh token generation
- Tokens expire after configured duration

---

### 2. Text Content Canvas (if `lesson.body_content` exists)

```typescript
// Conditional Render
{lesson.body_content && (
  <motion.article
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    class="bg-white border border-[#c4c6cf] rounded-xl p-8"
  >
    <div class="prose prose-sm max-w-none">
      <div class="text-[#0b1c30] leading-relaxed whitespace-pre-wrap">
        {lesson.body_content}
      </div>
    </div>
  </motion.article>
)}
```

**Features:**
- Prose typography with 16px base size (text-base)
- Relaxed line height (leading-relaxed)
- Wide-lined layout for readability
- White card background (surface-container-lowest)
- Subtle border (outline-variant)
- Entry animation (fade-in, slide-up)

**Typography Hierarchy:**
- Heading: 20px Hanken Grotesk (font-title-lg)
- Body: 16px Inter, leading-relaxed
- Color: `#0b1c30` (deep midnight)
- Container padding: 32px (p-8)

**Whitespace Rules:**
- Top/bottom padding: 32px (p-8)
- Paragraph spacing: 16px (space-y-4)
- List item spacing: 12px (space-y-3)

---

### 3. Resources Download Center (if `lesson.resources` exist)

```typescript
// Conditional Render: Right Sidebar
{lesson.resources && lesson.resources.length > 0 && (
  <div class="bg-white border border-[#c4c6cf] rounded-xl p-6">
    <h3 class="text-lg font-semibold text-[#002045] mb-4">Resources</h3>
    <div class="space-y-2">
      {lesson.resources.map((resource) => (
        <motion.button
          key={resource.id}
          onClick={() => handleResourceDownload(...)}
          class="w-full flex items-center gap-3 p-3 
                 bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg"
        >
          <FileText size={18} class="text-[#006b5f]" />
          <span class="flex-1 text-left text-sm font-medium truncate">
            {resource.filename}
          </span>
          {downloading ? <Spinner /> : <Download />}
        </motion.button>
      ))}
    </div>
  </div>
)}
```

**Features:**
- Button-style file list in right sidebar
- Each file: icon + filename + download button
- Hover state: translate-y -2px, enhanced background
- Loading state: spinner replaces download icon
- Signed URL generation on button click

**Download Flow:**
```typescript
// Security: Client-side signed URL generation
async handleResourceDownload(resourceId, storagePath, filename) {
  1. setDownloadingResourceId(resourceId)  // Show loading
  2. supabase.storage.from('lesson-attachments')
      .createSignedUrl(storagePath, 3600)   // 1-hour expiration
  3. Receive { signedUrl }
  4. Create <a> element with href={signedUrl}
  5. Trigger click() for native browser download
  6. Clean up DOM
  7. setDownloadingResourceId(null)         // Hide loading
}
```

**Security Model:**
- Each download generates unique signed URL
- URL expires after 1 hour
- Path from `lesson_resources.storage_path` (immutable)
- Filename from `lesson_resources.filename` (user-facing)

---

## 🚀 Multi-Content Lesson Examples

### Example 1: Video + Text + Resources (Complete Lesson)

**Database Payload:**
```json
{
  "id": "lesson-123",
  "title": "Introduction to React Hooks",
  "cloudflare_asset_id": "abc123def456",
  "body_content": "React Hooks allow you to...",
  "duration_seconds": 1800,
  "resources": [
    {
      "id": "res-1",
      "storage_path": "lesson-123/lecture-notes.pdf",
      "filename": "Lecture Notes.pdf"
    },
    {
      "id": "res-2",
      "storage_path": "lesson-123/code-examples.zip",
      "filename": "Code Examples.zip"
    }
  ]
}
```

**Rendered Output:**
- Top: 16:9 video player
- Below: Title, duration, preview badge
- Main: Text content in readable prose format
- Right sidebar: Download buttons for PDF + ZIP

---

### Example 2: Text-Only Lesson

**Database Payload:**
```json
{
  "id": "lesson-456",
  "title": "Course Syllabus",
  "body_content": "Welcome to the course...",
  "cloudflare_asset_id": null,
  "resources": []
}
```

**Rendered Output:**
- No video section (cloudflare_asset_id is null)
- Full-width text content canvas
- Right sidebar shows course info + progress only

---

### Example 3: Video-Only Lesson

**Database Payload:**
```json
{
  "id": "lesson-789",
  "title": "Live Q&A Session",
  "cloudflare_asset_id": "xyz789abc",
  "body_content": null,
  "resources": []
}
```

**Rendered Output:**
- Video player takes center stage
- No text content section
- Resources center empty
- Focus on visual presentation

---

## 🎨 Component Integration

### Center Canvas Component Structure

```jsx
<section class="col-span-6 space-y-6">
  {/* Video Player (Conditional) */}
  {lesson.cloudflare_asset_id && <VideoPlayer />}
  
  {/* Lesson Title & Metadata */}
  <div>
    <h1 class="text-3xl font-bold">Lesson Title</h1>
    <Badge>Preview | Duration | Status</Badge>
  </div>
  
  {/* Text Content (Conditional) */}
  {lesson.body_content && <TextCanvas />}
  
  {/* Action Buttons */}
  <ActionButtons />
</section>
```

### Side-by-Side Components

```jsx
<div class="grid grid-cols-12 gap-6">
  {/* Left Rail (3 cols) */}
  <CourseOutline />
  
  {/* Center Canvas (6 cols) */}
  <MediaCanvas />
  
  {/* Right Sidebar (3 cols) */}
  <ResourceCenter />
</div>
```

---

## 📊 Data Structure Requirements

### Lesson Table Extension

```sql
-- Required fields for multi-media support
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  course_id UUID NOT NULL,
  
  -- Multi-media fields
  cloudflare_asset_id TEXT,           -- Video: Cloudflare Stream ID
  body_content TEXT,                  -- Text: Markdown content
  
  -- Metadata
  sequence_order INTEGER,
  duration_seconds INTEGER,
  is_preview BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP
);

-- Separate table for resources
CREATE TABLE lesson_resources (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  
  storage_path TEXT NOT NULL,        -- Supabase Storage path
  filename TEXT NOT NULL,             -- User-facing filename
  
  created_at TIMESTAMP
);
```

---

## 🔐 Security Architecture

### Video Playback Security

```
┌─────────────────────────────────────────┐
│ Browser: LessonViewer Component         │
├─────────────────────────────────────────┤
│ 1. useEffect detects cloudflare_asset_id
│ 2. Calls: POST /api/get-lesson-playback-url
└──────────────────┬──────────────────────┘
                   │ HTTPS Request
                   ↓
┌─────────────────────────────────────────┐
│ Edge Function: get-lesson-playback-url  │
├─────────────────────────────────────────┤
│ 1. Verify Auth (JWT from Supabase)
│ 2. Check: user has access to lesson
│ 3. Call Cloudflare API (backend only)
│ 4. Generate signed HLS manifest URL
│ 5. Return iframe URL (time-limited)
└──────────────────┬──────────────────────┘
                   │ HTTPS Response
                   ↓
┌─────────────────────────────────────────┐
│ Browser: Render iframe                  │
├─────────────────────────────────────────┤
│ <iframe src="https://...signed-url..."/>
│ Token is: time-limited + signed
│ Token never: exposed to client JS
└─────────────────────────────────────────┘
```

### File Download Security

```
┌──────────────────────────────┐
│ User clicks Download         │
├──────────────────────────────┤
│ 1. handleResourceDownload()
│ 2. supabase.storage.createSignedUrl()
│ 3. Receive signed URL (1-hour expiry)
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Supabase validates:          │
├──────────────────────────────┤
│ • Signature (HMAC-SHA256)
│ • Timestamp (not expired)
│ • Bucket permissions (RLS)
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Browser downloads file       │
├──────────────────────────────┤
│ Native <a> click
│ Direct browser download
│ No app redownloading
└──────────────────────────────┘
```

---

## ⚡ Performance Optimizations

### Lazy Loading Strategy

```typescript
// Code splitting via React.lazy
const LessonViewerRefined = React.lazy(
  () => import('./pages/student/LessonViewerRefined')
);

// Suspense fallback for smooth transition
<Suspense fallback={<LoadingFallback />}>
  <LessonViewerRefined />
</Suspense>
```

### Progressive Content Loading

```typescript
// 1. Fetch lesson metadata immediately
// 2. Render layout shell
// 3. Fetch video playback URL (async)
// 4. Fetch course outline (async)
// 5. Render content as available

useEffect(() => fetchLessonData());     // Immediate
useEffect(() => fetchPlaybackUrl());    // If video
useEffect(() => fetchCourseOutline());  // Sidebar
```

### Image Optimization

```typescript
// Use Lucide icons (SVG) instead of image files
<FileText size={18} class="text-[#006b5f]" />
<Download size={16} class="text-[#006b5f]" />
<PlayCircle size={24} class="text-[#62fae3]" />
```

---

## 🎨 Visual Hierarchy & Focus

### Attention Flow (Top to Bottom)

1. **Video Player** (if exists) - Primary focal point
2. **Title & Metadata** - Secondary context
3. **Text Content** (if exists) - Deep reading
4. **Action Buttons** - Next steps

### Spatial Hierarchy

```
Very High Attention:   Video Player (16:9 prominent)
High Attention:        Lesson Title + Duration
Medium Attention:      Text Content Canvas
Low Attention:         Resources (sidebar)
Context:               Course Outline (left rail)
```

### Color Hierarchy

```
Primary Navy (#002045):       Titles, primary actions
Secondary Teal (#006b5f):     Interactive elements, progress
Accent Mint (#62fae3):        Success, highlights
Background (#f8f9ff):         Page canvas
Borders (#c4c6cf):            Subtle divisions
```

---

## 🧪 Testing Scenarios

### Test Case 1: Video + Text + Resources
```
✓ Video player renders with signed URL
✓ Text content displays below
✓ Resources download buttons functional
✓ Progress bars animate correctly
✓ Sidebar shows all data
✓ Navigation between lessons works
```

### Test Case 2: Text Only
```
✓ No video section renders
✓ Text content takes main area
✓ Layout remains balanced
✓ Resources section hidden if empty
✓ Course outline still visible
```

### Test Case 3: Video Only
```
✓ Video player renders large
✓ No text content section
✓ Resources sidebar mostly empty
✓ Focus remains on video
✓ Title and metadata visible
```

### Test Case 4: Mobile Responsive
```
✓ On mobile: 3-col layout stacks to single column
✓ Video maintains 16:9 aspect ratio
✓ Touch targets >= 44px (tap-friendly)
✓ Text remains readable (font-size)
✓ Navigation becomes accordion or modal
```

---

## 📈 Scalability Considerations

### Future Enhancements

1. **Interactive Quizzes** (lesson.quiz_id)
   - Render quiz widget below video/text
   - Track completion status

2. **Live Chat/Comments** (lesson.comments_enabled)
   - Real-time discussion panel
   - Instructor annotations

3. **Transcripts** (lesson.transcript_path)
   - Searchable video transcripts
   - Auto-sync with playback

4. **Adaptive Learning** (lesson.adaptive_variants)
   - Content branches based on quiz results
   - Personalized learning paths

### Database Schema Ready
```sql
-- Future extensions (nullable fields)
ALTER TABLE lessons ADD COLUMN quiz_id UUID;
ALTER TABLE lessons ADD COLUMN transcript_path TEXT;
ALTER TABLE lessons ADD COLUMN comments_enabled BOOLEAN;
ALTER TABLE lessons ADD COLUMN adaptive_variant_id UUID;
```

---

## 📚 Reference Documentation

- **Design System:** `design.instructions.md`
- **Implementation:** `FRONTEND_IMPLEMENTATION_GUIDE.md`
- **Tailwind Tokens:** `TAILWIND_DESIGN_TOKENS.md`
- **Setup Guide:** `FRONTEND_SETUP_GUIDE.md`
- **Database Schema:** `SUPABASE_COMPLETE_SETUP.sql`

---

## ✅ Verification Checklist

Before deploying Multi-Media Canvas:

- [ ] Video player loads with signed URL
- [ ] Text content renders with correct typography
- [ ] Resources download with signed Supabase URLs
- [ ] All three content types can coexist in single lesson
- [ ] Conditional rendering works (no errors if content missing)
- [ ] Progress bars animate smoothly
- [ ] Layout remains balanced across all scenarios
- [ ] Mobile responsive (stacked layout)
- [ ] No token exposure in browser console
- [ ] Error states display gracefully
- [ ] Loading spinners show during async operations
- [ ] Lucide icons render correctly
- [ ] Color tokens match ScholarStream hex codes
- [ ] Typography hierarchy preserved
- [ ] Spacing follows grid rules (gap-6, px-12)

---

**Multi-Media Learning Canvas v1.0**  
**Status:** ✅ Production Ready  
**Last Updated:** May 28, 2026
