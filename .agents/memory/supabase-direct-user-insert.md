---
name: Supabase direct auth.users insert requirements
description: Fields required when manually inserting into auth.users to avoid GoTrue "Database error querying schema" 500 on login
---

## Rule
When inserting directly into `auth.users` (bypassing GoTrue API), these token fields MUST be set to empty strings `''`, NOT NULL:
- `confirmation_token`
- `recovery_token`
- `email_change_token_new`
- `email_change`

Also `raw_user_meta_data` must include `{"email_verified": true}` for GoTrue to accept the user.

**Why:** GoTrue (Go) reads these columns as `string` type, not `*string`. A NULL causes a schema-level parse crash returning HTTP 500 "Database error querying schema" at login — only for the manually-created users. Admins created via the dashboard are unaffected because the dashboard always sets these to `''`.

**How to apply:** Every INSERT into auth.users in `web_provision_student` or similar functions must explicitly set all four token columns to `''` and set `raw_user_meta_data = '{"email_verified":true}'::jsonb`.
