import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/attendance/trends?weeks=6
 * Returns weekly attendance counts for the last N weeks (default 6).
 * Each entry: { label, presentCount, absentCount, totalMarked }
 * Admin-only — members should not see aggregate attendance trends.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const weeks = Math.min(Math.max(parseInt(searchParams.get("weeks") || "6", 10) || 6, 1), 12);

  const now = new Date();
  // Find the most recent Sunday as the end of the current week window.
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const dayOfWeek = end.getDay(); // 0 = Sunday
  end.setDate(end.getDate() - dayOfWeek); // roll back to Sunday

  const trends: { label: string; presentCount: number; absentCount: number; totalMarked: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(end);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const records = await db.attendance.findMany({
      where: {
        serviceDate: { gte: weekStart, lte: weekEnd },
      },
      select: { present: true },
    });

    const presentCount = records.filter((r) => r.present).length;
    const absentCount = records.length - presentCount;

    trends.push({
      label: weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      presentCount,
      absentCount,
      totalMarked: records.length,
    });
  }

  return NextResponse.json({ trends });
}
