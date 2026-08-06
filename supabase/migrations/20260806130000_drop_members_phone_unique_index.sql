-- ============================================================
-- Drop unique constraint on members.phone_number
--
-- Rationale:
--   Account uniqueness is enforced on user_profiles.phone (the login
--   credential). members.phone_number is a pastoral contact field —
--   it must be non-unique to handle shared phones (spouses, parents
--   registering on behalf of children, family devices, etc.).
-- ============================================================

DROP INDEX IF EXISTS public.idx_members_phone_number;
