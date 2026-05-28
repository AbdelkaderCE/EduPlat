# EduPlat Frontend - Environment Setup & Build Guide

## Project Overview

**EduPlat** is a closed-ecosystem educational platform with the following characteristics:
- Off-platform payments (no in-app transactions)
- Manual account provisioning via admin dashboard
- Entitlement-driven content access
- Bundle-based course grouping
- Secure Cloudflare Stream video delivery
- Swiss Design principles with ScholarStream design system

## Tech Stack

### Core Framework
- **React 18+** - UI framework with functional components and hooks
- **React Router v6** - SPA routing with protected routes
- **TypeScript** - Type safety and better IDE support
- **Tailwind CSS** - Utility-first CSS with custom ScholarStream tokens

### Libraries
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Modern icon library
- **@supabase/supabase-js** - Backend integration (Auth, Database, Storage)

### Backend
- **Supabase** - PostgreSQL database with RLS policies
- **Cloudflare Stream** - Video hosting with signed URLs
- **Edge Functions** - Serverless provisioning and playback token generation

---

## Installation & Setup

### 1. Prerequisites

Ensure you have installed:
- **Node.js** 16.x or higher ([download](https://nodejs.org/))
- **npm** 7.x or higher (included with Node.js)
- **Git** (for version control)

Verify installation:
```bash
node --version  # Should be v16.0.0 or higher
npm --version   # Should be 7.0.0 or higher
```

### 2. Clone the Repository

```bash
cd c:\Users\djell\OneDrive\سطح المكتب
git clone <repository-url>
cd EduPlat
```

### 3. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`:
- React and React Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Supabase JS Client

### 4. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Create the file
touch .env.local
```

Add the following environment variables (get values from Supabase project settings):

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...

# Cloudflare Configuration (optional, if using video delivery)
REACT_APP_CLOUDFLARE_ACCOUNT_ID=your-account-id
REACT_APP_CLOUDFLARE_STREAM_TOKEN=your-stream-token
```

**How to get these values:**

1. **Supabase URL & Key:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Click **Settings** → **API**
   - Copy `Project URL` and `anon (public)` key

2. **Cloudflare Account ID & Token:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Account Settings** → **API Tokens**
   - Create a token with appropriate permissions
   - Note your Account ID

### 5. Verify Setup

```bash
npm run build
```

This command compiles TypeScript and builds the production bundle. If successful, you'll see:
```
✓ Successfully compiled
✓ Built in X.XXs
```

---

## Development Workflow

### Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000/` with hot module reloading (HMR).

### Available NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start dev server with HMR |
| `npm run build` | Create production bundle |
| `npm test` | Run test suite (if configured) |
| `npm run lint` | Check TypeScript and code quality |
| `npm run format` | Format code with Prettier |

### First Login

1. Navigate to `http://localhost:3000/login`
2. Use credentials from Supabase Auth:
   - Email: Use an account you've created in Supabase
   - Password: The password you set
3. Dashboard will load based on your role:
   - **Students** → `/student` (course dashboard)
   - **Admins** → `/admin` (admin dashboard)

---

## Project File Structure

```
EduPlat/
├── src/
│   ├── config/
│   │   └── supabaseClient.ts          # Supabase initialization
│   ├── types/
│   │   └── index.ts                   # TypeScript interfaces
│   ├── hooks/
│   │   └── useAuth.ts                 # Authentication state management
│   ├── components/
│   │   ├── Header.tsx                 # Fixed navigation bar
│   │   └── shared/
│   │       └── Button.tsx             # Reusable button component
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # Email/password login
│   │   │   └── ResetPasswordPage.tsx  # Password recovery
│   │   ├── student/
│   │   │   ├── Dashboard.tsx          # Course dashboard (12-col layout)
│   │   │   ├── LessonViewer.tsx       # Secure video player + resources
│   │   │   └── AccountSettings.tsx    # Profile & password management
│   │   └── admin/
│   │       ├── Dashboard.tsx          # Admin overview & quick actions
│   │       ├── ProvisioningForm.tsx   # Manual access provisioning
│   │       └── AuditLog.tsx           # Access audit log viewer
│   ├── App.tsx                        # Main router with role-based guards
│   └── index.tsx                      # React root
├── public/
│   ├── index.html                     # HTML entry point
│   └── favicon.ico
├── package.json                       # Dependencies & scripts
├── tailwind.config.js                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
└── .env.local                         # Environment variables (create this)
```

---

## Key Components & Features

### Authentication Flow

1. **Login Page** (`/login`)
   - Email + password form
   - Supabase Auth integration
   - Auto-redirect to role-based dashboard

2. **Reset Password** (`/reset-password`)
   - Email verification
   - OTP code entry
   - Password update

### Student Dashboard

**Route:** `/student`

Features:
- 12-column grid layout (8 col content + 4 col sidebar)
- Course list with progress bars
- Sidebar with stats, recent activity, support CTA
- Framer Motion animations on load

### Lesson Viewer

**Route:** `/student/lesson/:lessonId`

Features:
- Secure Cloudflare video player
- Protected file downloader (signed URLs)
- Course outline sidebar
- Progress tracking

### Account Settings

**Route:** `/student/settings`

Features:
- Profile edit (name, email)
- Password change
- Account info (member since, role)
- Logout

### Admin Dashboard

**Route:** `/admin`

Features:
- Stats cards (users, courses, revenue)
- Quick action links
- Recent activity feed

### Admin Provisioning

**Route:** `/admin/provision`

Features:
- Manual student provisioning form
- Email, name, payment reference entry
- Content type selector (course, bundle, all-access)
- Direct RPC trigger to `web_provision_student`

### Audit Log

**Route:** `/admin/audit`

Features:
- Tabular view of access events
- Date range filtering
- Event type filtering
- CSV export
- Real-time audit trail

---

## Design System (ScholarStream)

All components follow ScholarStream design specifications:

### Color Palette
```
Primary Navy:     #002045 (headings, primary actions)
Secondary Teal:   #006b5f (interactive elements)
Accent Mint:      #62fae3 (highlights, success)
Background:       #f8f9ff (page background)
Border:           #c4c6cf (subtle dividers)
Text Dark:        #0b1c30 (body text)
Text Light:       #43474e (secondary text)
```

### Typography
```
Display Large:    Hanken Grotesk, 36px, bold
Display Medium:   Hanken Grotesk, 28px, bold
Title Large:      Hanken Grotesk, 24px, semibold
Title Small:      Inter, 18px, semibold
Body:             Inter, 16px, regular
Label:            Inter, 14px, medium
Caption:          Inter, 12px, regular
```

### Grid & Spacing
```
Max Width:        1280px
Columns:          12
Gap:              24px (desktop)
Margin:           48px (desktop), 16px (mobile)
```

### Motion
```
Duration:         300ms (standard transitions)
Easing:           ease-in-out (smooth)
Hover:            scale 1.05 on interactive elements
Tap:              scale 0.95 on buttons
```

---

## Database Integration

### Supabase RLS Policies

All database queries are protected by Row-Level Security (RLS):
- Students can only see courses they're entitled to
- Admins can see all data
- Audit logs are automatically created on access

### Available RPC Functions

1. **`web_provision_student`** - Atomic provisioning (profile + entitlement)
   ```typescript
   await supabase.rpc('web_provision_student', {
     p_student_email: 'user@example.com',
     p_student_full_name: 'John Doe',
     p_order_id: 'ORD-2024-001',
     p_entitlement_type: 'explicit',
     p_course_id: 'course-id-123',
     p_bundle_id: null,
     p_granted_by: admin_user_id,
   });
   ```

2. **`get-lesson-playback-url`** (Edge Function)
   - Returns signed Cloudflare HLS manifest URL
   - Called by LessonViewer component

3. **`get-resource-download-url`** (Edge Function)
   - Generates short-lived signed URL for file download
   - Called by ProtectedFileDownloader component

---

## Testing Workflow

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout clears session
- [ ] Protected routes redirect to login when not authenticated
- [ ] Password reset flow works end-to-end

**Student Dashboard:**
- [ ] Dashboard loads with courses (RLS filters correctly)
- [ ] Progress bars animate on load
- [ ] Clicking course navigates to lesson viewer
- [ ] Sidebar stats display correct data

**Lesson Viewer:**
- [ ] Video player loads with signed URL
- [ ] Resource download button generates signed URL
- [ ] Download completes without errors
- [ ] Back button returns to dashboard

**Admin Provisioning:**
- [ ] Form validates all required fields
- [ ] Submitting provisions new student access
- [ ] Success message displays
- [ ] Audit log records the provisioning event

**Audit Log:**
- [ ] Date filter works correctly
- [ ] Event type filter shows only selected events
- [ ] CSV export downloads with data
- [ ] Pagination or infinite scroll shows all logs

---

## Common Troubleshooting

### Issue: "Module not found: 'react'" or similar

**Solution:** Dependencies not installed
```bash
npm install
```

### Issue: "Cannot find module 'supabase'" or connection errors

**Solution:** .env.local not configured correctly
```bash
# Verify .env.local exists and contains:
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

### Issue: Tailwind styles not applying

**Solution:** Rebuild Tailwind cache
```bash
npm run build
# OR
npx tailwindcss -i ./src/index.css -o ./src/output.css
```

### Issue: TypeScript errors in IDE

**Solution:** Reload TypeScript server
- VS Code: Ctrl+K Ctrl+J → Select "Reload TypeScript Server"
- Other editors: Restart the IDE or language server

### Issue: "CORS error" when calling Edge Functions

**Solution:** Check CORS headers in Edge Function configuration
- Verify Edge Function is deployed to correct Supabase project
- Check Authorization headers are correct

---

## Deployment

### Build for Production

```bash
npm run build
```

This generates optimized bundle in `build/` directory.

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts to connect project and deploy.

### Deploy to Netlify

```bash
npm run build
# Drag & drop 'build' folder to Netlify
# OR
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

### Environment Variables in Production

Set in platform settings:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

---

## Next Steps

1. **Install dependencies:** `npm install`
2. **Configure .env.local** with Supabase credentials
3. **Start dev server:** `npm start`
4. **Test login flow** with Supabase Auth user
5. **Verify dashboard loads** with correct data
6. **Explore each route** (student, admin, lesson viewer, etc.)

---

## Support Resources

- **React Documentation:** https://react.dev/
- **React Router Guide:** https://reactrouter.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Supabase Docs:** https://supabase.com/docs
- **Framer Motion:** https://www.framer.com/motion/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## Contact & Issues

For questions or issues:
1. Check the troubleshooting section above
2. Review relevant documentation links
3. Check Supabase project logs for backend errors
4. Verify browser console for frontend errors (F12 → Console tab)

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Ready for Development
