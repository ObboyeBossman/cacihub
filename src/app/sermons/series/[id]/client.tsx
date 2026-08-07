"use client";

import { useEffect } from "react";
import { SeriesDetail } from "@/components/sermons/caci/series-detail";
import { useSermonStore } from "@/store/sermons";
import type { SermonSeries } from "@/lib/sermons";
import { Header } from "@/components/sermons/caci/header";

interface Props {
  series: SermonSeries;
}

export function PublicSeriesClient({ series }: Props) {
  const openSeries = useSermonStore((s) => s.openSeries);

  // Sync the Zustand store so SeriesDetail works correctly
  useEffect(() => {
    openSeries(series.id);
  }, [series.id, openSeries]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <SeriesDetail series={series} />
      </main>
    </div>
  );
}
