import { Header } from "@/components/sermons/caci/header";
import { Hero } from "@/components/sermons/caci/hero";
import { Footer } from "@/components/sermons/caci/footer";
import { db } from "@/lib/db";
import { SermonsCatalog } from "@/components/sermons/caci/sermons-catalog";

export const revalidate = 60; // revalidate public page every minute

export default async function SermonsPage() {
  const sermonsRaw = await db.sermon.findMany({
    orderBy: { date: "desc" },
    include: {
      media: { orderBy: { sequence: "asc" } },
    },
  }).catch(() => []);

  const sermons = sermonsRaw.map((s) => ({
    id: s.id,
    sequence: s.sequence,
    title: s.title,
    preacher: s.speaker,
    speakerRole: s.speakerRole ?? null,
    datePreached: s.date.toISOString(),
    summary: s.summary ?? null,
    description: s.description ?? "",
    theme: s.theme ?? "Sunday Message",
    scripture: s.scriptureReference ?? "",
    keyTakeaways: Array.isArray(s.keyTakeaways) ? (s.keyTakeaways as string[]) : [],
    quotations: JSON.stringify(s.quotations ?? []),
    media: (s.media ?? []).map((m) => ({
      id: m.id,
      sermonId: m.sermonId,
      type: m.type as "video" | "audio" | "pdf" | "text",
      url: m.url,
      label: m.label ?? null,
      sequence: m.sequence,
    })),
    duration: s.durationSeconds ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero totalSermons={sermons.length} />
        <section id="sermons" className="py-12 sm:py-16">
          <SermonsCatalog sermons={sermons} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
