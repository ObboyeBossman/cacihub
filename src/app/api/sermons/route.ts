import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SermonDTO } from "@/lib/types";

export const runtime = "nodejs";

function toDTO(s: any): SermonDTO {
  return {
    id: s.id,
    seriesId: s.seriesId,
    seriesTitle: s.series?.title ?? null,
    sequence: s.sequence,
    title: s.title,
    speaker: s.speaker,
    date: s.date.toISOString(),
    description: s.description,
    theme: s.theme,
    scriptureReference: s.scriptureReference,
    quotations: Array.isArray(s.quotations) ? s.quotations : [],
    audioUrl: s.audioUrl,
    videoUrl: s.videoUrl,
    coverImageUrl: s.coverImageUrl,
    durationSeconds: s.durationSeconds,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

const WITH_SERIES = { series: { select: { title: true } } };

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const seriesId = searchParams.get("seriesId");

  if (id) {
    const sermon = await db.sermon.findUnique({ where: { id }, include: WITH_SERIES });
    if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ sermon: toDTO(sermon) });
  }

  const where = seriesId ? { seriesId } : {};
  const sermons = await db.sermon.findMany({
    where,
    orderBy: seriesId
      ? [{ sequence: "asc" }]
      : [{ date: "desc" }],
    take: 200,
    include: WITH_SERIES,
  });

  return NextResponse.json({ sermons: sermons.map(toDTO) });
}

// POST /api/sermons (admin)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, speaker, date, description, theme, scriptureReference,
    quotations, audioUrl, videoUrl, coverImageUrl, durationSeconds,
    seriesId, sequence,
  } = body;

  if (!title?.trim() || !speaker?.trim() || !date) {
    return NextResponse.json({ error: "Title, speaker, and date are required." }, { status: 400 });
  }

  // Auto-sequence within series
  let seq = Number(sequence) || 1;
  if (seriesId && !sequence) {
    const last = await db.sermon.findFirst({
      where: { seriesId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    seq = last ? last.sequence + 1 : 1;
  }

  const sermon = await db.sermon.create({
    data: {
      title: title.trim(),
      speaker: speaker.trim(),
      date: new Date(date),
      description: description || null,
      theme: theme || null,
      scriptureReference: scriptureReference || null,
      quotations: Array.isArray(quotations) ? quotations : [],
      audioUrl: audioUrl || null,
      videoUrl: videoUrl || null,
      coverImageUrl: coverImageUrl || null,
      durationSeconds: durationSeconds ? Number(durationSeconds) : null,
      seriesId: seriesId || null,
      sequence: seq,
      createdById: session.id,
    },
    include: WITH_SERIES,
  });

  // Auto-notify all active members about the new sermon
  try {
    const activeMembers = await db.member.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeMembers.length > 0) {
      const seriesName = sermon.series?.title ? ` — ${sermon.series.title}` : "";
      await db.notification.createMany({
        data: activeMembers.map((m) => ({
          memberId: m.id,
          type: "sermon",
          referenceId: sermon.id,
          title: "New Sermon Available",
          body: `${sermon.title} by ${sermon.speaker}${seriesName}`,
        })),
        skipDuplicates: true,
      });
    }
  } catch (notifErr) {
    // Notification failure must never block the sermon upload response
    console.error("[sermons POST] notification error:", notifErr);
  }

  return NextResponse.json({ sermon: toDTO(sermon) }, { status: 201 });
}

// PATCH /api/sermons (admin) — body: { id, ...updates }
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  for (const f of ["title", "speaker", "description", "theme", "scriptureReference", "audioUrl", "videoUrl", "coverImageUrl"]) {
    if (updates[f] !== undefined) data[f] = updates[f] || null;
  }
  if (updates.title) data.title = updates.title.trim();
  if (updates.speaker) data.speaker = updates.speaker.trim();
  if (updates.date) data.date = new Date(updates.date);
  if (updates.quotations !== undefined) data.quotations = Array.isArray(updates.quotations) ? updates.quotations : [];
  if (updates.durationSeconds !== undefined) data.durationSeconds = updates.durationSeconds ? Number(updates.durationSeconds) : null;
  if (updates.seriesId !== undefined) data.seriesId = updates.seriesId || null;
  if (updates.sequence !== undefined) data.sequence = Number(updates.sequence);

  const sermon = await db.sermon.update({ where: { id }, data, include: WITH_SERIES });
  return NextResponse.json({ sermon: toDTO(sermon) });
}

// DELETE /api/sermons?id=...
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.sermon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
