import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const s = await db.sermonSeries.findUnique({
      where: { id },
      include: {
        sermons: {
          select: {
            id: true,
            title: true,
            theme: true,
            scriptureReference: true,
            sequence: true,
            date: true,
            speaker: true,
            durationSeconds: true,
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!s) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const sermons = s.sermons.map((m) => ({
      id: m.id,
      title: m.title,
      theme: m.theme ?? "",
      scripture: m.scriptureReference ?? "",
      sequence: m.sequence,
      datePreached: m.date instanceof Date ? m.date.toISOString() : m.date,
      preacher: m.speaker,
      duration: m.durationSeconds ?? null,
    }));

    const series = {
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      theme: s.theme ?? "",
      anchorText: s.anchorText,
      coverImage: s.coverImage,
      year: s.year,
      status: s.status,
      startDate: s.startDate instanceof Date ? s.startDate.toISOString() : s.startDate,
      endDate: s.endDate instanceof Date ? s.endDate.toISOString() : s.endDate,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      sermons,
      sermonCount: sermons.length,
      latestSermon: sermons.length > 0 ? sermons[sermons.length - 1] : null,
    };

    return NextResponse.json({ series });
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
  }
}
