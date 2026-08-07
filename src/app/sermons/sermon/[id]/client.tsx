"use client";

import { useEffect } from "react";
import { SermonDetail } from "@/components/sermons/caci/sermon-detail";
import { useSermonStore } from "@/store/sermons";
import { Header } from "@/components/sermons/caci/header";
import type { Sermon, SermonSeries } from "@/lib/sermons";

interface Props {
  sermon: Sermon & { series: SermonSeries | null };
  seriesId?: string;
}

export function PublicSermonClient({ sermon, seriesId }: Props) {
  const openSermon = useSermonStore((s) => s.openSermon);

  useEffect(() => {
    openSermon(sermon.id, seriesId);
  }, [sermon.id, seriesId, openSermon]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <SermonDetail
          sermonId={sermon.id}
          seriesId={seriesId}
          series={sermon.series}
        />
      </main>
    </div>
  );
}
