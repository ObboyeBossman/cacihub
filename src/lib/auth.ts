// ============================================================
// CACI HUB — Auth Helpers (server-side)
// Session stored in httpOnly cookie 'caci_session'.
// Password hashing: bcrypt (cost 12) via bcryptjs.
// ============================================================

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "caci_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const BCRYPT_ROUNDS = 12;

/** Hash a password with bcrypt (random salt, cost 12). */
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/** Verify a plaintext password against a bcrypt hash. */
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/** Encode session payload as base64 JSON. */
function encodeSession(payload: SessionUser): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

function decodeSession(raw: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function setSession(payload: SessionUser): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Read & validate the session against the DB. Returns null if invalid/inactive.
 *
 * By default a suspended account (isActive=false) resolves to null, so every
 * API route guard (`if (!session) return 401`) continues to reject suspended
 * users with no change to those routes.
 *
 * Pass `{ includeSuspended: true }` to instead receive the session with
 * `isSuspended: true` for a suspended account. This is used by the /me route
 * so the client can render the dedicated "Account Suspended" screen rather
 * than silently bouncing to login.
 */
export async function getSession(
  options?: { includeSuspended?: boolean },
): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = decodeSession(raw);
  if (!payload) return null;

  // Validate against DB
  const profile = await db.userProfile.findUnique({
    where: { id: payload.id },
  });
  if (!profile) return null;
  // Suspended account: only surface the session when the caller explicitly
  // opts in. Otherwise treat as logged-out (preserves existing API guards).
  if (!profile.isActive && !options?.includeSuspended) return null;

  const refreshed: SessionUser = {
    id: profile.id,
    role: profile.role as "admin" | "member",
    fullName: profile.fullName,
    isActive: profile.isActive,
    isSuspended: !profile.isActive,
    mustChangePassword: profile.mustChangePassword,
    phone: profile.phone,
    memberId: payload.memberId,
  };

  return refreshed;
}

/** Require a session; throws redirect-friendly null otherwise. */
export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s || s.isSuspended) {
    throw new Error("UNAUTHORIZED");
  }
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return s;
}
