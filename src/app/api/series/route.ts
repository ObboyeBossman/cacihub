import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Helper: convert durationSeconds (Int) → "32m" style string
function formatDuration(seconds: number | null): number | null {
  return seconds ?? null;
}

export async function GET() {
  try {
    const series = await db.sermonSeries.findMany({
      orderBy: [{ year: "desc" }, { startDate: "desc" }],
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

    // Map to the standalone app's expected shape
    const mapped = series.map((s) => {
      const sermons = s.sermons.map((m) => ({
        id: m.id,
        title: m.title,
        theme: m.theme ?? "",
        scripture: m.scriptureReference ?? "",
        sequence: m.sequence,
        datePreached: m.date instanceof Date ? m.date.toISOString() : m.date,
        preacher: m.speaker,
        duration: formatDuration(m.durationSeconds),
      }));

      return {
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
    });

    return NextResponse.json({ series: mapped });
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 });
  }
}
