# EduPlat

A modern Next.js + Supabase educational platform starter.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth via `@supabase/supabase-js` and `@supabase/ssr`

## Setup

1. Create a Supabase project.
2. Copy your values into `.env.local`.
3. Install dependencies and run the app.

```powershell
npm install
npm run dev
```

## Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` is required for the admin onboarding action

## Demo Admin

To see `/admin`, promote an existing Supabase user to `admin` by running `supabase-demo-admin.sql` in the Supabase SQL Editor.

1. Sign up with the email you want to use for the demo admin.
2. Open `supabase-demo-admin.sql` and replace `you@example.com` with that email.
3. Paste and run the SQL in Supabase.
4. Refresh the app and open `/admin`.

## Routes

- `/` redirects to `/login`
- `/login` authenticates users with Supabase Auth
- `/dashboard` is protected by a Supabase session check
- `/admin` is visible only to profiles with role `admin`
