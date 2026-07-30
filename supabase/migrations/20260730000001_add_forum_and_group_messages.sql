-- ============================================================
-- Migration: add_forum_and_group_messages
-- Creates forum_messages and group_messages tables that exist
-- in the Prisma schema but were missing from the squashed
-- baseline migration (20260709000000_caci_v1_squashed.sql).
-- Uses IF NOT EXISTS throughout — safe to run on any state.
-- Run: supabase db push
-- ============================================================

-- ---- Assembly-wide forum message board ----

CREATE TABLE IF NOT EXISTS public.forum_messages (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  member_id   TEXT        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_messages_created_at ON public.forum_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_messages_member_id  ON public.forum_messages(member_id);

-- RLS off — access controlled by custom auth at the API layer
ALTER TABLE public.forum_messages DISABLE ROW LEVEL SECURITY;

-- ---- Group chat messages ----

CREATE TABLE IF NOT EXISTS public.group_messages (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id    TEXT        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id   TEXT        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_messages_member_id     ON public.group_messages(member_id);

-- RLS off — access controlled by custom auth at the API layer
ALTER TABLE public.group_messages DISABLE ROW LEVEL SECURITY;
