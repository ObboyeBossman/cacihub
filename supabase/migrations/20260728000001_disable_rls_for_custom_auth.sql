-- =============================================================================
-- CACI HUB — Migration: Disable RLS on server-only tables
--
-- Context: The app uses a custom phone+password auth system through Prisma.
-- All DB access is server-side (Next.js API routes) using the Prisma client
-- with DATABASE_URL. There is no Supabase Auth JWT in scope — so all the
-- existing RLS policies that use auth.uid() and public.is_admin() evaluate to
-- false/null for every request, blocking INSERTs and UPDATEs.
--
-- Fix: Disable RLS on tables that are only ever accessed server-side through
-- Prisma. The Prisma client already enforces auth at the API layer (getSession,
-- requireAdmin checks in every route handler). RLS on these tables provides no
-- additional security in a custom-auth architecture and actively breaks writes.
--
-- Tables affected:
--   user_profiles    — admin provisions accounts; all access via API routes
--   assembly_settings — admin-only reads/writes via API routes
--   members          — admin/member access controlled at API layer
--   member_permissions — admin-controlled
--   broadcasts       — admin creates, members read via API
--   broadcast_recipients — populated server-side only
--   notifications    — populated server-side only
--   groups           — admin creates, members read via API
--   group_members    — managed server-side only
--   sermons          — admin creates, all read via API
--   forum_messages   — member creates, all read via API
--   group_messages   — member creates, group members read via API
--   member_audit_log — populated server-side only
-- =============================================================================

ALTER TABLE public.user_profiles        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_settings    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.members              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_permissions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_messages       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_audit_log     DISABLE ROW LEVEL SECURITY;
