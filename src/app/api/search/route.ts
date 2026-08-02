import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SearchResultDTO } from "@/lib/types";

export const runtime = "nodejs";

/**
 * GET /api/search?q=...
 * Global search across sermons, broadcasts, events, and members.
 * Returns up to 5 results per category, sorted by relevance (date desc).
 * Authenticated (admin + member).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResultDTO[] = [];
  const isAdmin = session.role === "admin";

  // ── Sermons ──
  const sermons = await db.sermon.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { speaker: { contains: q, mode: "insensitive" } },
        { theme: { contains: q, mode: "insensitive" } },
        { scriptureReference: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, speaker: true, date: true },
    orderBy: { date: "desc" },
    take: 5,
  });
  for (const s of sermons) {
    results.push({
      type: "sermon",
      id: s.id,
      title: s.title,
      subtitle: s.speaker,
      date: s.date.toISOString(),
    });
  }

  // ── Broadcasts ──
  const broadcasts = await db.broadcast.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, sentAt: true },
    orderBy: { sentAt: "desc" },
    take: 5,
  });
  for (const b of broadcasts) {
    results.push({
      type: "broadcast",
      id: b.id,
      title: b.title,
      subtitle: null,
      date: b.sentAt.toISOString(),
    });
  }

  // ── Events ──
  const events = await db.assemblyEvent.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, location: true, startDate: true },
    orderBy: { startDate: "desc" },
    take: 5,
  });
  for (const e of events) {
    results.push({
      type: "event",
      id: e.id,
      title: e.title,
      subtitle: e.location,
      date: e.startDate.toISOString(),
    });
  }

  // ── Members ──
  // Members can search other members; admins see all.
  const members = await db.member.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(isAdmin ? {} : { membershipStatus: { in: ["active", "visitor"] } }),
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { assemblyRole: { contains: q, mode: "insensitive" } },
        { occupation: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, fullName: true, assemblyRole: true, title: true },
    orderBy: { fullName: "asc" },
    take: 5,
  });
  for (const m of members) {
    results.push({
      type: "member",
      id: m.id,
      title: m.fullName,
      subtitle: m.assemblyRole || m.title,
      date: null,
    });
  }

  return NextResponse.json({ results });
}
