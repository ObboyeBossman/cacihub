import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { AssemblyEventDTO, EventCategory } from "@/lib/types";

export const runtime = "nodejs";

const VALID_CATEGORIES: EventCategory[] = [
  "service",
  "meeting",
  "conference",
  "retreat",
  "outreach",
  "other",
];

function isCategory(v: string): v is EventCategory {
  return (VALID_CATEGORIES as string[]).includes(v);
}

function toDTO(e: any): AssemblyEventDTO {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    location: e.location ?? null,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
    isAllDay: e.isAllDay,
    category: e.category as EventCategory,
    createdByName: e.creator?.fullName ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

// GET /api/events?[upcoming=true][&limit=20][&from=ISO][&to=ISO]
// Authenticated (admin + member). Members see upcoming events; admins can filter by range.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {};
  if (upcoming) {
    where.startDate = { gte: new Date() };
  } else if (from || to) {
    where.startDate = {};
    if (from) where.startDate.gte = new Date(from);
    if (to) where.startDate.lte = new Date(to);
  }

  const events = await db.assemblyEvent.findMany({
    where,
    include: { creator: { select: { fullName: true } } },
    orderBy: { startDate: "asc" },
    take: limit,
  });

  return NextResponse.json({ events: events.map(toDTO) });
}

// POST /api/events (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, location, startDate, endDate, isAllDay, category, notifyMembers } = body as {
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    category?: string;
    notifyMembers?: boolean;
  };

  if (!title?.trim() || !startDate) {
    return NextResponse.json(
      { error: "Title and start date are required." },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  }

  let end: Date | null = null;
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
    }
  }

  const cat = category && isCategory(category) ? category : "service";

  const event = await db.assemblyEvent.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      startDate: start,
      endDate: end,
      isAllDay: isAllDay ?? false,
      category: cat,
      createdBy: session.id,
    },
    include: { creator: { select: { fullName: true } } },
  });

  // Notify all active members (unless the admin explicitly opted out).
  if (notifyMembers !== false) {
    const members = await db.member.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (members.length > 0) {
      const dateLabel = start.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeLabel = event.isAllDay
        ? "All day"
        : start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const notifBody = `${dateLabel} at ${timeLabel}${location ? ` · ${location}` : ""}`;
      await db.notification.createMany({
        data: members.map((m) => ({
          memberId: m.id,
          type: "event",
          referenceId: event.id,
          title: `📅 ${event.title}`,
          body: notifBody,
        })),
      });
    }
  }

  return NextResponse.json({ event: toDTO(event) }, { status: 201 });
}

// PATCH /api/events (admin only) — update by id
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, title, description, location, startDate, endDate, isAllDay, category } = body as {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isAllDay?: boolean;
    category?: string;
  };

  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const existing = await db.assemblyEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const data: any = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (location !== undefined) data.location = location?.trim() || null;
  if (startDate !== undefined) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
    data.startDate = start;
  }
  if (endDate !== undefined) {
    data.endDate = endDate ? new Date(endDate) : null;
  }
  if (isAllDay !== undefined) data.isAllDay = isAllDay;
  if (category !== undefined && isCategory(category)) data.category = category;

  const event = await db.assemblyEvent.update({
    where: { id },
    data,
    include: { creator: { select: { fullName: true } } },
  });

  return NextResponse.json({ event: toDTO(event) });
}

// DELETE /api/events?id=... (admin only)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.assemblyEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
