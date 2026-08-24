import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicSermonClient } from "./client";
import type { SermonMedia } from "@/lib/sermons";

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
    });

    if (!raw) return { title: "Sermon" };

    const coverUrl = raw.coverImageUrl || null;
    const pageUrl = `${APP_URL}/sermons/sermon/${raw.id}`;
    const description = raw.description
      || `${raw.speaker} · ${raw.scriptureReference || "Sermon"} — Assakae Central Assembly (CACI)`;

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
    speakerRole: raw.speakerRole ?? null,
    duration: raw.durationSeconds ?? null,
    summary: raw.summary ?? null,
    description: raw.description ?? "",
    keyTakeaways: Array.isArray(raw.keyTakeaways) ? (raw.keyTakeaways as string[]) : [],
    quotations: typeof raw.quotations === "string"
      ? raw.quotations
      : JSON.stringify(raw.quotations ?? []),
    media: (raw.media ?? []).map((m) => ({
      id: m.id,
      sermonId: m.sermonId,
      type: m.type as "video" | "audio" | "pdf" | "text",
      url: m.url,
      label: m.label ?? null,
      sequence: m.sequence,
    })),
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };

  return <PublicSermonClient sermon={sermon} />;
}
