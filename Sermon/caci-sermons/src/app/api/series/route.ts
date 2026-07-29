import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
            scripture: true,
            sequence: true,
            datePreached: true,
            preacher: true,
            duration: true,
          },
          orderBy: { sequence: "asc" },
        },
      },
    });

    const withMeta = series.map((s) => ({
      ...s,
      sermonCount: s.sermons.length,
      latestSermon: s.sermons[s.sermons.length - 1] ?? null,
    }));

    return NextResponse.json({ series: withMeta });
  } catch (error) {
    console.error("Failed to fetch series:", error);
    return NextResponse.json(
      { error: "Failed to fetch series" },
      { status: 500 }
    );
  }
}
