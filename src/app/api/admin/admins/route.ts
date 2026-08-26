import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { UserProfileDTO } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  const where: any = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  } else {
    // By default, just return admins if no search query
    where.role = "admin";
  }

  const profiles = await db.userProfile.findMany({
    where,
    orderBy: { fullName: "asc" },
    take: 50,
  });

  const admins: UserProfileDTO[] = profiles.map(p => ({
    id: p.id,
    role: p.role as any,
    fullName: p.fullName,
    isActive: p.isActive,
    mustChangePassword: p.mustChangePassword,
    phone: p.phone,
    createdAt: p.createdAt.toISOString(),
    linkedMemberId: null,
  }));

  return NextResponse.json({ admins });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, role } = await req.json();

  if (!userId || (role !== "admin" && role !== "member")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (userId === session.id && role === "member") {
    return NextResponse.json({ error: "You cannot revoke your own admin access" }, { status: 400 });
  }

  const profile = await db.userProfile.update({
    where: { id: userId },
    data: { role },
  });

  return NextResponse.json({
    admin: {
      id: profile.id,
      role: profile.role,
      fullName: profile.fullName,
    }
  });
}
