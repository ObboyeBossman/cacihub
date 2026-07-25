import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword, setSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/auth/change-password
// Body: { currentPassword: string; newPassword: string }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters." },
      { status: 400 },
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from your current password." },
      { status: 400 },
    );
  }

  const profile = await db.userProfile.findUnique({ where: { id: session.id } });
  if (!profile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, profile.passwordHash)) {
    return NextResponse.json(
      { error: "Incorrect current password." },
      { status: 401 },
    );
  }

  await db.userProfile.update({
    where: { id: session.id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  // Refresh session so mustChangePassword is cleared client-side
  const refreshed = { ...session, mustChangePassword: false };
  await setSession(refreshed);

  return NextResponse.json({ ok: true, user: refreshed });
}
