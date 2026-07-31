import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { SermonSeriesDTO, SermonDTO } from "@/lib/types";

export const runtime = "nodejs";

function sermonToDTO(s: any): SermonDTO {
  return {
    id: s.id,
    seriesId: s.seriesId,
    seriesTitle: s.series?.title ?? null,
    sequence: s.sequence ?? 0,
    title: s.title,
    speaker: s.speaker,
    date: s.date instanceof Date ? s.date.toISOString() : s.date,
    description: s.description ?? null,
    theme: s.theme ?? null,
    scriptureReference: s.scriptureReference ?? null,
    quotations: Array.isArray(s.quotations) ? s.quotations : [],
    audioUrl: s.audioUrl ?? null,
    videoUrl: s.videoUrl ?? null,
    coverImageUrl: s.coverImageUrl ?? null,
    durationSeconds: s.durationSeconds ?? null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

function toDTO(s: any, sermonCount?: number): SermonSeriesDTO {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    theme: s.theme,
    anchorText: s.anchorText,
    coverImage: s.coverImage,
    year: s.year,
    status: s.status as "ongoing" | "completed",
    startDate: s.startDate ? s.startDate.toISOString() : null,
    endDate: s.endDate ? s.endDate.toISOString() : null,
    sermonCount: sermonCount ?? s._count?.sermons ?? 0,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

// GET /api/sermon-series  — list all, or ?id=... for single
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const include = searchParams.get("include");
    const withSermons = include === "sermons";

    if (id) {
      const series = await db.sermonSeries.findUnique({
        where: { id },
        include: {
          _count: { select: { sermons: true } },
          ...(withSermons ? {
            sermons: { orderBy: [{ sequence: "asc" }, { date: "asc" }] },
          } : {}),
        },
      });
      if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (withSermons) {
        return NextResponse.json({
          series: { ...toDTO(series), sermons: (series as any).sermons.map(sermonToDTO) },
        });
      }
      return NextResponse.json({ series: toDTO(series) });
    }

    const all = await db.sermonSeries.findMany({
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { sermons: true } },
        ...(withSermons ? {
          sermons: { orderBy: [{ sequence: "asc" }, { date: "asc" }] },
        } : {}),
      },
    });

    if (withSermons) {
      return NextResponse.json({
        series: all.map((s) => ({
          ...toDTO(s),
          sermons: (s as any).sermons.map(sermonToDTO),
        })),
      });
    }

    return NextResponse.json({ series: all.map((s) => toDTO(s)) });
  } catch (err: any) {
    console.error("[sermon-series GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/sermon-series (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { title, description, theme, anchorText, coverImage, year, status, startDate, endDate } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // createdById is nullable — only pass it if session.id resolves to a real user_profile row
    // Use a raw upsert-safe approach: attempt with FK, fall back without it
    let series;
    try {
      series = await db.sermonSeries.create({
        data: {
          title: title.trim(),
          description: description || null,
          theme: theme || null,
          anchorText: anchorText || null,
          coverImage: coverImage || null,
          year: Number(year) || new Date().getFullYear(),
          status: status || "ongoing",
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdById: session.id,
        },
        include: { _count: { select: { sermons: true } } },
      });
    } catch (fkErr: any) {
      // If FK constraint fails (session.id not in user_profiles), retry without createdById
      if (fkErr?.code === "P2003" || fkErr?.code === "23503") {
        series = await db.sermonSeries.create({
          data: {
            title: title.trim(),
            description: description || null,
            theme: theme || null,
            anchorText: anchorText || null,
            coverImage: coverImage || null,
            year: Number(year) || new Date().getFullYear(),
            status: status || "ongoing",
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            createdById: null,
          },
          include: { _count: { select: { sermons: true } } },
        });
      } else {
        throw fkErr;
      }
    }

    return NextResponse.json({ series: toDTO(series) }, { status: 201 });
  } catch (err: any) {
    console.error("[sermon-series POST]", err);
    const message = err?.message?.includes("sermon_series")
      ? "Database table not found — run the sermon_series migration."
      : (err?.message ?? "Failed to create series");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/sermon-series (admin only) — body: { id, ...updates }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: any = {};
    for (const f of ["title", "description", "theme", "anchorText", "coverImage", "status"]) {
      if (updates[f] !== undefined) data[f] = updates[f] || null;
    }
    if (updates.title) data.title = updates.title.trim();
    if (updates.year !== undefined) data.year = Number(updates.year);
    if (updates.startDate !== undefined) data.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.endDate !== undefined) data.endDate = updates.endDate ? new Date(updates.endDate) : null;

    const series = await db.sermonSeries.update({
      where: { id },
      data,
      include: { _count: { select: { sermons: true } } },
    });

    return NextResponse.json({ series: toDTO(series) });
  } catch (err: any) {
    console.error("[sermon-series PATCH]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update series" }, { status: 500 });
  }
}

// DELETE /api/sermon-series?id=... (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Delete sermons first (cascade), then series
    await db.sermon.deleteMany({ where: { seriesId: id } });
    await db.sermonSeries.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[sermon-series DELETE]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete series" }, { status: 500 });
  }
}
