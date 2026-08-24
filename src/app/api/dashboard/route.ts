import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { normalizeGhanaPhone } from "@/lib/phone";
import type { DashboardStatsDTO } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/dashboard
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For members, return minimal personal stats
  if (session.role === "member" && session.memberId) {
    return NextResponse.json({
      stats: {
        totalMembers: 0,
        activeMembers: 0,
        visitorCount: 0,
        inactiveCount: 0,
        totalGroups: 0,
        activeGroups: 0,
        totalBroadcasts: 0,
        broadcastsThisWeek: 0,
        totalSermons: 0,
        unreadNotifications: 0,
        memberGrowth: [],
        statusBreakdown: [],
        recentMembers: [],
        recentBroadcasts: [],
      } as DashboardStatsDTO,
    });
  }

  // Admin dashboard
  const [
    memberStatusGroups,
    totalSermons,
    recentMembersRaw,
  ] = await Promise.all([
    db.member.groupBy({
      by: ["membershipStatus"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    db.sermon.count(),
    db.member.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Derive member counts from the single groupBy result
  const countByStatus = Object.fromEntries(
    memberStatusGroups.map((g) => [g.membershipStatus, g._count._all])
  );
  const totalMembers = memberStatusGroups.reduce((s, g) => s + g._count._all, 0);
  const activeMembers = countByStatus["active"] ?? 0;
  const visitorCount = countByStatus["visitor"] ?? 0;
  const inactiveCount = countByStatus["inactive"] ?? 0;

  // Last 6 months growth
  const now = new Date();
  const monthRanges = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    return { start, end, label: start.toLocaleDateString("en-GB", { month: "short" }) };
  });

  const monthCounts = await Promise.all(
    monthRanges.map(({ start, end }) =>
      db.member.count({ where: { createdAt: { gte: start, lt: end } } })
    )
  );
  const months = monthRanges.map(({ label }, i) => ({ label, value: monthCounts[i] }));

  const stats: DashboardStatsDTO = {
    totalMembers,
    activeMembers,
    visitorCount,
    inactiveCount,
    totalGroups: 0,
    activeGroups: 0,
    totalBroadcasts: 0,
    broadcastsThisWeek: 0,
    totalSermons,
    unreadNotifications: 0,
    memberGrowth: months,
    statusBreakdown: [
      { label: "Active", value: activeMembers, color: "#1a7f37" },
      { label: "Visitors", value: visitorCount, color: "#9a6700" },
      { label: "Inactive", value: inactiveCount, color: "#6e7681" },
    ],
    recentMembers: recentMembersRaw.map((m) => ({
      id: m.id,
      membershipNumber: m.membershipNumber,
      title: m.title,
      fullName: m.fullName,
      dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
      gender: m.gender as any,
      maritalStatus: m.maritalStatus as any,
      occupation: m.occupation,
      location: m.location,
      phoneNumber: m.phoneNumber,
      whatsappNumber: m.whatsappNumber,
      membershipStatus: m.membershipStatus as any,
      assemblyRole: m.assemblyRole,
      joinDate: m.joinDate?.toISOString() ?? null,
      profilePhotoUrl: m.profilePhotoUrl,
      emergencyContactName: m.emergencyContactName,
      emergencyContactPhone: m.emergencyContactPhone,
      emergencyContactRelationship: m.emergencyContactRelationship,
      isActive: m.isActive,
      deletedAt: m.deletedAt?.toISOString() ?? null,
      authUserId: m.authUserId,
      appRole: null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      groupCount: 0,
    })),
    recentBroadcasts: [],
  };

  return NextResponse.json({ stats });
}

// POST /api/dashboard?sub=provision (admin) — provision a member account
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { fullName, phone, role, linkedMemberId, password } = body;

  if (!fullName?.trim() || !phone) {
    return NextResponse.json({ error: "Full name and phone are required." }, { status: 400 });
  }
  const normalized = normalizeGhanaPhone(phone);
  if (!normalized) return NextResponse.json({ error: "Invalid Ghana phone." }, { status: 400 });

  const existing = await db.userProfile.findUnique({ where: { phone: normalized } });
  if (existing) return NextResponse.json({ error: "A user with this phone already exists." }, { status: 400 });

  const defaultPw = password || "CACI@2026!";

  const profile = await db.userProfile.create({
    data: {
      role: role || "member",
      fullName: fullName.trim(),
      phone: normalized,
      passwordHash: await hashPassword(defaultPw),
      isActive: true,
      mustChangePassword: true,
    },
  });

  // Link to member if provided
  if (linkedMemberId && role === "member") {
    await db.member.update({
      where: { id: linkedMemberId },
      data: { authUserId: profile.id },
    });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      role: profile.role,
      fullName: profile.fullName,
      isActive: profile.isActive,
      mustChangePassword: profile.mustChangePassword,
      phone: profile.phone,
      createdAt: profile.createdAt.toISOString(),
      linkedMemberId: linkedMemberId || null,
    },
    defaultPassword: defaultPw,
  }, { status: 201 });
}
