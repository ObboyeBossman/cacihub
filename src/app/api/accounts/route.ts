import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/accounts
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await db.userProfile.findMany({
    orderBy: { createdAt: "desc" },
  });

  // UserProfile has no Prisma relation to Member — authUserId on Member points here.
  // Resolve linked members in a single follow-up query instead of a missing include.
  const userIds = users.map((u) => u.id);
  const linkedMembers = userIds.length
    ? await db.member.findMany({
        where: { authUserId: { in: userIds }, deletedAt: null },
        select: { id: true, fullName: true, authUserId: true },
      })
    : [];

  const memberByUserId = Object.fromEntries(
    linkedMembers.map((m) => [m.authUserId!, m]),
  );

  return NextResponse.json({
    accounts: users.map((u) => ({
      id: u.id,
      role: u.role,
      fullName: u.fullName,
      isActive: u.isActive,
      mustChangePassword: u.mustChangePassword,
      phone: u.phone,
      createdAt: u.createdAt.toISOString(),
      linkedMemberId: memberByUserId[u.id]?.id ?? null,
      linkedMemberName: memberByUserId[u.id]?.fullName ?? null,
    })),
  });
}

// POST /api/accounts — provision a new user account
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { fullName, phone, role, linkedMemberId, password } = body;

  if (!fullName?.trim()) return NextResponse.json({ error: "fullName is required." }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "phone is required." }, { status: 400 });
  if (!["admin", "member"].includes(role)) return NextResponse.json({ error: "role must be admin or member." }, { status: 400 });

  // Check for duplicate phone
  const existing = await db.userProfile.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "A user account with this phone number already exists." }, { status: 409 });
  }

  // Resolve default password from assembly settings
  const settings = await db.assemblySetting.findFirst();
  const defaultPassword = password || settings?.defaultPassword || "CACI@2026!";
  const passwordHash = await hashPassword(defaultPassword);

  const user = await db.userProfile.create({
    data: {
      fullName: fullName.trim(),
      phone,
      role,
      passwordHash,
      isActive: true,
      mustChangePassword: true,
    },
  });

  // Link to member profile if provided
  if (linkedMemberId) {
    await db.member.update({
      where: { id: linkedMemberId },
      data: { authUserId: user.id },
    }).catch(() => {}); // non-fatal if member not found
  }

  return NextResponse.json({ user, defaultPassword }, { status: 201 });
}

// PATCH /api/accounts — body: { id, isActive?, mustChangePassword?, resetPassword?, role? }
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, isActive, mustChangePassword, resetPassword, role } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (mustChangePassword !== undefined) data.mustChangePassword = mustChangePassword;
  if (role !== undefined) data.role = role;

  let resetTo: string | null = null;
  if (resetPassword) {
    const settings = await db.assemblySetting.findFirst();
    const newPw = settings?.defaultPassword || "CACI@2026!";
    data.passwordHash = await hashPassword(newPw);
    data.mustChangePassword = true;
    resetTo = newPw;
  }

  const user = await db.userProfile.update({ where: { id }, data });

  return NextResponse.json({
    account: {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    },
    resetTo,
  });
}

// DELETE /api/accounts?id=... — suspends (sets isActive=false)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (id === session.id) {
    return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
  }

  await db.userProfile.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
