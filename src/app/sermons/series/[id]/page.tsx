import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { normaliseCoverUrl } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cacihub.com";

// ── Static params for ISR ───────────────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const series = await db.sermonSeries.findMany({
      select: { id: true },
    });
    return series.map((s) => ({ id: s.id }));
  } catch {
    return [];
  }
}

// ── Revalidate every 5 minutes ──────────────────────────────────────────────
export const revalidate = 300;

// ── OG Metadata for social media crawlers ────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const s = await db.sermonSeries.findUnique({
      where: { id },
      include: {
        sermons: {
          select: { id: true, title: true, sequence: true },
          orderBy: { sequence: "asc" },
          take: 1,
        },
      },
    });

    if (!s) return { title: "Sermon Series" };

    const coverUrl = normaliseCoverUrl(s.coverImage);
    const pageUrl = `${APP_URL}/sermons/series/${s.id}`;
    const firstSermon = s.sermons[0];
    const description = s.description
      || (firstSermon ? `${s.sermons.length}-message series starting with \"${firstSermon.title}\"` : `A sermon series from Assakae Central Assembly (CACI)`);

    return {
      title: `${s.title} — CACI Sermons`,
      description,
      openGraph: {
        title: s.title,
        description,
        url: pageUrl,
        siteName: "CACI Assakae Central Assembly",
        type: "website",
        images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: s.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: s.title,
        description,
        images: coverUrl ? [coverUrl] : [],
      },
    };
  } catch {
    return { title: "Sermon Series" };
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function PublicSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!s) notFound();

  const series = {
    id: s.id,
    title: s.title,
    description: s.description ?? "",
    theme: s.theme ?? "",
    anchorText: s.anchorText,
    coverImage: normaliseCoverUrl(s.coverImage),
    year: s.year,
    status: s.status,
    startDate: s.startDate instanceof Date ? s.startDate.toISOString() : s.startDate,
    endDate: s.endDate instanceof Date ? s.endDate.toISOString() : s.endDate,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    sermons: s.sermons.map((m) => ({
      id: m.id,
      title: m.title,
      theme: m.theme ?? "",
      scripture: m.scriptureReference ?? "",
      sequence: m.sequence,
      datePreached: m.date instanceof Date ? m.date.toISOString() : String(m.date),
      preacher: m.speaker,
      duration: m.durationSeconds ?? null,
    })),
    sermonCount: s.sermons.length,
    latestSermon: s.sermons.length > 0 ? s.sermons[s.sermons.length - 1] : null,
  };

  return <PublicSeriesClient series={series} />;
}

// ── Client wrapper that reuses the existing SeriesDetail component ─────────────
import { PublicSeriesClient } from "./client";
