// =============================================================================
// CACI Hub — Edge Function: seed-user-account
//
// Provisions a Supabase Auth user account for Abraham Nhyiraba Obboye Bossman
// (member_id: 37e8593c-2e6a-4ce6-b029-6693f51bd281) with the default password
// "password123" and sets must_change_password = true so they are prompted to
// reset it on first login.
//
// This function is idempotent — safe to run more than once. If the account
// already exists it returns the existing user rather than erroring.
//
// Invoke (one-time, admin only):
//   curl -X POST https://<project-ref>.supabase.co/functions/v1/seed-user-account \
//     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
//
// Environment variables required (set automatically in Supabase):
//   SUPABASE_URL              — injected by runtime
//   SUPABASE_SERVICE_ROLE_KEY — injected by runtime
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MEMBER_ID   = "37e8593c-2e6a-4ce6-b029-6693f51bd281";
const MEMBER_NAME = "Abraham Nhyiraba Obboye Bossman";
const MEMBER_PHONE = "233593529509";
// Phone used as the email-equivalent identifier in Supabase Auth
// We use a synthetic email so Supabase Auth accepts the account.
const AUTH_EMAIL  = `${MEMBER_PHONE}@caci.internal`;
const PASSWORD    = "password123";

Deno.serve(async (req: Request) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Use the service-role client — bypasses RLS, needed for admin auth operations
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ── 1. Check if a user already exists for this member ──────────────────────
    const { data: existingMember, error: memberFetchError } = await supabase
      .from("members")
      .select("id, full_name, auth_user_id")
      .eq("id", MEMBER_ID)
      .single();

    if (memberFetchError || !existingMember) {
      return json({ error: "Member not found", detail: memberFetchError?.message }, 404);
    }

    if (existingMember.auth_user_id) {
      // Account already provisioned — return info without re-creating
      return json({
        ok: true,
        message: "Account already exists — no changes made.",
        auth_user_id: existingMember.auth_user_id,
      });
    }

    // ── 2. Create the Supabase Auth user ────────────────────────────────────────
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: AUTH_EMAIL,
      password: PASSWORD,
      email_confirm: true, // skip email verification — admin-provisioned account
      user_metadata: {
        full_name: MEMBER_NAME,
        phone: MEMBER_PHONE,
      },
    });

    if (createError || !newUser.user) {
      return json({ error: "Failed to create auth user", detail: createError?.message }, 500);
    }

    const authUserId = newUser.user.id;

    // ── 3. Create the user_profiles row ─────────────────────────────────────────
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authUserId,           // must match auth.users.id
        role: "member",
        full_name: MEMBER_NAME,
        is_active: true,
        must_change_password: true, // force password reset on first login
      });

    if (profileError) {
      // Roll back: delete the auth user we just created
      await supabase.auth.admin.deleteUser(authUserId);
      return json({ error: "Failed to create user profile", detail: profileError.message }, 500);
    }

    // ── 4. Link the member row back to the auth user ─────────────────────────────
    const { error: linkError } = await supabase
      .from("members")
      .update({ auth_user_id: authUserId })
      .eq("id", MEMBER_ID);

    if (linkError) {
      // Roll back both the auth user and the profile row
      await supabase.from("user_profiles").delete().eq("id", authUserId);
      await supabase.auth.admin.deleteUser(authUserId);
      return json({ error: "Failed to link member to auth user", detail: linkError.message }, 500);
    }

    // ── 5. Done ──────────────────────────────────────────────────────────────────
    return json({
      ok: true,
      message: "Account provisioned successfully.",
      member: MEMBER_NAME,
      auth_user_id: authUserId,
      email: AUTH_EMAIL,
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
