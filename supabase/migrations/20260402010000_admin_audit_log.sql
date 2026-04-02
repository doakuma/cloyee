-- ============================================================
-- Migration: Admin audit log table (DOA-5)
-- Date: 2026-04-02
-- Description: Creates admin_audit_log to track all admin actions
--              for security auditing and incident response.
-- Run in: Supabase Dashboard → SQL Editor (as postgres / service_role)
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text        NOT NULL,           -- e.g. 'user.toggle_admin', 'category.delete'
  target_type text,                           -- e.g. 'user', 'category', 'feedback'
  target_id   text,                           -- id of the affected record
  details     jsonb,                          -- additional context (before/after values, names)
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for actor lookups (who did what)
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx ON admin_audit_log (actor_id, created_at DESC);
-- Index for target lookups (what happened to this record)
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON admin_audit_log (target_type, target_id, created_at DESC);

-- RLS: only admins can read, no direct user inserts (service_role only)
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- No INSERT policy for regular users — inserts happen only via service_role in API routes
