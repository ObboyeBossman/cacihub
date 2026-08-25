"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/sermons/caci/header";
import { Hero } from "@/components/sermons/caci/hero";
import { Footer } from "@/components/sermons/caci/footer";
import { SermonsCatalog } from "@/components/sermons/caci/sermons-catalog";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { Sermon } from "@/lib/sermons";
import { ArrowLeft, Layout } from "lucide-react";

export function PublicSermonsView() {
  const { navigate, back } = useApp();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermons.list();
        if (!mounted) return;
        const mapped: Sermon[] = (res.sermons || []).map((s) => ({
          id: s.id,
          sequence: s.sequence,
          title: s.title,
          preacher: s.speaker,
          speakerRole: s.speakerRole ?? null,
          datePreached: s.date,
          summary: s.summary ?? null,
          description: s.description ?? "",
          theme: s.theme ?? "Sunday Message",
          scripture: s.scriptureReference ?? "",
          keyTakeaways: s.keyTakeaways ?? [],
          quotations: JSON.stringify(s.quotations ?? []),
          media: (s.media ?? []).map((m) => ({
            id: m.id,
            sermonId: m.sermonId,
            type: m.type,
            url: m.url,
            label: m.label ?? null,
            sequence: m.sequence,
          })),
          duration: s.durationSeconds ?? null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));
        setSermons(mapped);
      } catch {
        if (mounted) setSermons([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background relative">
      {/* Floating Design Bar to return to App Portal */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-n900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-full shadow-2xl border border-white/10 text-xs">
        <Layout className="w-3.5 h-3.5 text-caci-gold" />
        <span className="font-medium hidden sm:inline">Public Page Design Mode</span>
        <button
          onClick={() => back()}
          className="bg-caci-blue hover:bg-caci-blue-dim text-white font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Exit Design Mode</span>
        </button>
      </div>

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
