-- =============================================================================
-- CACI HUB — Migration: Drop dangling auth.users FK from user_profiles
--
-- Problem:
--   The original squashed migration created user_profiles.id as:
--     id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
--   This created a FK constraint named `user_profiles_id_fkey` pointing to
--   auth.users. Migration 20260725120000 dropped `user_profiles_pkey` (the
--   primary key) and re-typed the id column to text, but it never explicitly
--   dropped the FK constraint `user_profiles_id_fkey`.
--
--   Result: every INSERT into user_profiles fails with:
--     "Foreign key constraint violated on the constraint: user_profiles_id_fkey"
--   because the app's custom auth system has no auth.users rows to reference.
--
-- Fix:
--   Drop the FK constraint if it still exists. Idempotent — safe to re-run.
-- =============================================================================

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
