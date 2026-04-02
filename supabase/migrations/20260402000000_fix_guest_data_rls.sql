-- ============================================================
-- Migration: Fix guest data exposure (DOA-4)
-- Date: 2026-04-02
-- Description: Remove user_id IS NULL from sessions/reviews SELECT/INSERT
--              policies to prevent any user from reading guest data rows.
--              categories.user_id IS NULL rows are default categories and
--              MUST remain visible to all authenticated users — no change.
-- Run in: Supabase Dashboard → SQL Editor (as postgres / service_role)
-- ============================================================

-- ─── Diagnostic: inspect current policies before applying ────────────────────
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('sessions', 'reviews', 'categories')
-- ORDER BY tablename, cmd;

-- ─── sessions ────────────────────────────────────────────────────────────────
-- Problem: existing SELECT policy allows `user_id IS NULL`, so any
-- authenticated (or anonymous-key) caller can read all guest sessions.

-- Drop all existing SELECT / INSERT policies on sessions
-- (adjust names if your Supabase project used different names)
DROP POLICY IF EXISTS "Users can view own sessions"            ON sessions;
DROP POLICY IF EXISTS "sessions_select"                        ON sessions;
DROP POLICY IF EXISTS "Enable read access for own sessions"    ON sessions;
DROP POLICY IF EXISTS "Allow users to read own sessions"       ON sessions;

DROP POLICY IF EXISTS "Users can insert own sessions"          ON sessions;
DROP POLICY IF EXISTS "sessions_insert"                        ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users"  ON sessions;
DROP POLICY IF EXISTS "Allow users to insert own sessions"     ON sessions;

-- Recreate: authenticated users can only access their own rows
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── reviews ─────────────────────────────────────────────────────────────────
-- Drop all existing SELECT / INSERT policies on reviews
DROP POLICY IF EXISTS "Users can view own reviews"             ON reviews;
DROP POLICY IF EXISTS "reviews_select"                         ON reviews;
DROP POLICY IF EXISTS "Enable read access for own reviews"     ON reviews;
DROP POLICY IF EXISTS "Allow users to read own reviews"        ON reviews;

DROP POLICY IF EXISTS "Users can insert own reviews"           ON reviews;
DROP POLICY IF EXISTS "reviews_insert"                         ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users"  ON reviews;
DROP POLICY IF EXISTS "Allow users to insert own reviews"      ON reviews;

-- Recreate: match ownership through user_id directly
CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── categories ──────────────────────────────────────────────────────────────
-- NO CHANGE: user_id IS NULL rows are default system categories that all
-- authenticated users must be able to read.
-- Current policy (correct): SELECT WHERE user_id IS NULL OR auth.uid() = user_id
