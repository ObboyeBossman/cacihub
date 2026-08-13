import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { normaliseCoverUrl } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cacihub.com";

// ── OG Metadata for social media crawlers ────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const raw = await db.sermon.findUnique({
      where: { id },
      include: { series: true },
    });

    if (!raw) return { title: "Sermon" };

    const seriesTitle = raw.series?.title ? ` · ${raw.series.title}` : "";
    const coverUrl = raw.series
      ? normaliseCoverUrl(raw.series.coverImage)
      : null;
    const pageUrl = `${APP_URL}/sermons/sermon/${raw.id}`;
    const description = raw.description
      || `${raw.speaker} · ${raw.scriptureReference || "Sermon"}${seriesTitle} — Assakae Central Assembly (CACI)`;

    return {
      title: `${raw.title} — CACI Sermons`,
      description,
      openGraph: {
        title: raw.title,
        description,
        url: pageUrl,
        siteName: "CACI Assakae Central Assembly",
        type: "article",
        images: coverUrl ? [{ url: coverUrl, width: 1200, height: 630, alt: raw.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: raw.title,
        description,
        images: coverUrl ? [coverUrl] : [],
      },
    };
  } catch {
    return { title: "Sermon" };
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function PublicSermonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const raw = await db.sermon.findUnique({
    where: { id },
    include: {
      series: true,
      media: { orderBy: { sequence: "asc" } },
    },
  });

  if (!raw) notFound();

  // Build the sermon object in the shape expected by the public components
  const sermon = {
    id: raw.id,
    title: raw.title,
    theme: raw.theme ?? "",
    scripture: raw.scriptureReference ?? "",
    sequence: raw.sequence,
    datePreached: raw.date instanceof Date ? raw.date.toISOString() : String(raw.date),
    preacher: raw.speaker,
    speakerRole: (raw as any).speakerRole ?? null,
    duration: raw.durationSeconds ?? null,
    seriesId: raw.seriesId ?? "",
    summary: (raw as any).summary ?? null,
    description: raw.description ?? "",
    keyTakeaways: Array.isArray((raw as any).keyTakeaways) ? (raw as any).keyTakeaways : [],
    quotations: typeof raw.quotations === "string"
      ? raw.quotations
      : JSON.stringify(raw.quotations ?? []),
    media: (raw.media ?? []).map((m) => ({
      id: m.id,
      sermonId: m.sermonId,
      type: m.type,
      url: m.url,
      label: m.label ?? null,
      description: (m as any).description ?? null,
      sequence: m.sequence,
    })),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    series: raw.series
      ? {
          id: raw.series.id,
          title: raw.series.title,
          description: raw.series.description ?? "",
          theme: raw.series.theme ?? "",
          anchorText: raw.series.anchorText,
          coverImage: normaliseCoverUrl(raw.series.coverImage),
          year: raw.series.year,
          status: raw.series.status,
          startDate: raw.series.startDate instanceof Date
            ? raw.series.startDate.toISOString()
            : raw.series.startDate,
          endDate: raw.series.endDate instanceof Date
            ? raw.series.endDate.toISOString()
            : raw.series.endDate,
          createdAt: raw.series.createdAt.toISOString(),
          updatedAt: raw.series.updatedAt.toISOString(),
          sermons: [],
          sermonCount: 0,
          latestSermon: null,
        }
      : null,
  };

  return <PublicSermonClient sermon={sermon} seriesId={raw.seriesId ?? undefined} />;
}

import { PublicSermonClient } from "./client";
