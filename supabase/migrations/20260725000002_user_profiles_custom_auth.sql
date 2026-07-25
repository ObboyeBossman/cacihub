-- =============================================================================
-- CACI HUB — Migration: Add custom auth columns to user_profiles
--
-- The app uses a custom phone + password login system (not Supabase Auth OTP).
-- user_profiles needs:
--   phone         — normalised Ghana phone (233XXXXXXXXX, 12 digits, no +)
--   password_hash — sha256("caci_salt_" + password) as hex string
-- =============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone         text UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash text;

COMMENT ON COLUMN public.user_profiles.phone IS
  'Normalised Ghana phone number in 233XXXXXXXXX format (12 digits, no + prefix). '
  'Used as the login identifier for the custom auth system.';

COMMENT ON COLUMN public.user_profiles.password_hash IS
  'bcrypt hash (cost 12) via bcryptjs. Random salt per password — production-safe.';

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles (phone);
