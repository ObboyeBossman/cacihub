// =============================================================================
// CACI Hub — Edge Function: seed-user-account
//
// Provisions a Supabase Auth user account for Abraham Nhyiraba Obboye Bossman
// (member_id: 37e8593c-2e6a-4ce6-b029-6693f51bd281) using phone-number auth.
//
// Auth method: phone only — no email, no synthetic email workaround.
// Phone number stored in E.164 format: +233593529509
//
// Default password: "password123"
// must_change_password = true — user is prompted to reset on first login.
//
// Idempotent — safe to run more than once. If the account already exists
// it returns the existing user without making any changes.
//
// Invoke (one-time, admin only):
//   curl -X POST https://<project-ref>.supabase.co/functions/v1/seed-user-account \
//     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
//
// Environment variables required (injected automatically by Supabase runtime):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const MEMBER_ID    = "37e8593c-2e6a-4ce6-b029-6693f51bd281";
const MEMBER_NAME  = "Abraham Nhyiraba Obboye Bossman";
// E.164 format required by Supabase phone auth
const PHONE        = "+233593529509";
// Normalised phone stored in user_profiles (no + prefix, 12 digits)
const PHONE_STORED = "233593529509";
const PASSWORD     = "password123";

/** bcrypt cost factor — matches the Next.js app (src/lib/auth.ts). */
const BCRYPT_ROUNDS = 12;

/** Hash a password with bcrypt (random salt per hash). */
async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── 1. Check if member already has an auth account ──────────────────────
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("id, full_name, auth_user_id")
      .eq("id", MEMBER_ID)
      .single();

    if (memberErr || !member) {
      return json({ error: "Member not found", detail: memberErr?.message }, 404);
    }

    if (member.auth_user_id) {
      return json({
        ok: true,
        message: "Account already exists — no changes made.",
        auth_user_id: member.auth_user_id,
      });
    }

    // ── 2. Create Supabase Auth user with phone + password ───────────────────
    // phone_confirm: true skips OTP verification — admin-provisioned account
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      phone: PHONE,
      password: PASSWORD,
      phone_confirm: true,
      user_metadata: {
        full_name: MEMBER_NAME,
      },
    });

    if (createErr || !newUser.user) {
      return json({ error: "Failed to create auth user", detail: createErr?.message }, 500);
    }

    const authUserId = newUser.user.id;

    // ── 3. Create user_profiles row ──────────────────────────────────────────
    // phone + password_hash are required by the app's custom login system
    // (see src/app/api/auth/login/route.ts + src/lib/auth.ts)
    const passwordHash = await hashPassword(PASSWORD);

    const { error: profileErr } = await supabase
      .from("user_profiles")
      .upsert(
        {
          id: authUserId,
          role: "admin",
          full_name: MEMBER_NAME,
          phone: PHONE_STORED,
          password_hash: passwordHash,
          is_active: true,
          must_change_password: true,
        },
        { onConflict: "id" },
      );

    if (profileErr) {
      // Roll back the auth user
      await supabase.auth.admin.deleteUser(authUserId);
      return json({ error: "Failed to create user profile", detail: profileErr.message }, 500);
    }

    // ── 4. Link member row to auth user ──────────────────────────────────────
    const { error: linkErr } = await supabase
      .from("members")
      .update({ auth_user_id: authUserId })
      .eq("id", MEMBER_ID);

    if (linkErr) {
      // Roll back profile and auth user
      await supabase.from("user_profiles").delete().eq("id", authUserId);
      await supabase.auth.admin.deleteUser(authUserId);
      return json({ error: "Failed to link member to auth user", detail: linkErr.message }, 500);
    }

    // ── 5. Done ──────────────────────────────────────────────────────────────
    return json({
      ok: true,
      message: "Account provisioned successfully.",
      member: MEMBER_NAME,
      auth_user_id: authUserId,
      phone: PHONE,
      must_change_password: true,
      note: "Password is 'password123'. User will be prompted to change it on first login.",
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: "Unexpected error", detail: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
