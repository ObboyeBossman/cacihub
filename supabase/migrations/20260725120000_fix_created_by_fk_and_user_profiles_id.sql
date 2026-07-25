-- =============================================================================
-- CACI HUB — Migration: Fix created_by FK and user_profiles id type
--
-- Problem: user_profiles.id is uuid referencing auth.users(id), but the app
-- uses a custom auth system with Prisma-generated cuid() string IDs. All
-- created_by columns on groups/members/sermons also reference auth.users,
-- so Prisma inserts fail with FK/type violations.
--
-- Fix:
--   1. Drop the auth.users FK from user_profiles and make id a free text PK.
--   2. Change user_profiles.id column type from uuid to text.
--   3. Re-create created_by columns on groups, members, sermons as text
--      columns referencing user_profiles(id) instead of auth.users(id).
-- =============================================================================

-- ─── 1. Free user_profiles from auth.users ───────────────────────────────────

-- Drop the FK constraint that ties user_profiles.id to auth.users.id
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_pkey CASCADE;

-- Change the id column from uuid to text (to accept cuid() from Prisma)
ALTER TABLE public.user_profiles
  ALTER COLUMN id TYPE text USING id::text;

-- Re-add primary key
ALTER TABLE public.user_profiles
  ADD PRIMARY KEY (id);

-- ─── 2. Fix groups.created_by ────────────────────────────────────────────────

ALTER TABLE public.groups
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE public.groups
  ADD COLUMN created_by text REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ─── 3. Fix members.created_by ───────────────────────────────────────────────

ALTER TABLE public.members
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE public.members
  ADD COLUMN created_by text REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ─── 4. Fix sermons.created_by ───────────────────────────────────────────────

ALTER TABLE public.sermons
  DROP COLUMN IF EXISTS created_by;

ALTER TABLE public.sermons
  ADD COLUMN created_by text REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ─── 5. Fix audit_log.changed_by if it also references auth.users ────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'member_audit_log' AND column_name = 'changed_by'
  ) THEN
    ALTER TABLE public.member_audit_log
      DROP COLUMN IF EXISTS changed_by;

    ALTER TABLE public.member_audit_log
      ADD COLUMN changed_by text REFERENCES public.user_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 6. Also fix broadcasts.sent_by ──────────────────────────────────────────
-- broadcasts.sent_by references user_profiles (check and re-point if needed)
DO $$
BEGIN
  -- Drop and recreate if it was pointing to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'broadcasts'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'users'
      AND ccu.column_name = 'id'
  ) THEN
    ALTER TABLE public.broadcasts DROP COLUMN IF EXISTS sent_by;
    ALTER TABLE public.broadcasts ADD COLUMN sent_by text REFERENCES public.user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

