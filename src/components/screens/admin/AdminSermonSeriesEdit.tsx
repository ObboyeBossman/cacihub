"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesDTO } from "@/lib/types";
import { AdminSermonSeriesAdd } from "./AdminSermonSeriesAdd";
import { CACISkeleton, CACICard, EmptyState, CACIButton } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function AdminSermonSeriesEdit() {
  const { params, back, setAdminMobileMenuOpen } = useApp();
  const seriesId = params.seriesId;

  const [series, setSeries] = useState<SermonSeriesDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!seriesId) { back(); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermonSeries.get(seriesId);
        if (mounted) setSeries(res.series);
      } catch (e: any) {
        if (mounted) setFetchError(e?.message || "Failed to load series");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [seriesId, back]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Edit Series" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Edit Series" subtitle="Loading…" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <CACICard>
            <div className="space-y-3">
              <CACISkeleton className="h-5 w-1/3" />
              <CACISkeleton className="h-10 w-full" />
              <CACISkeleton className="h-24 w-full" />
              <CACISkeleton className="h-10 w-full" />
            </div>
          </CACICard>
        </div>
      </>
    );
  }

  if (fetchError || !series) {
    return (
      <>
        <MobileHeader title="Edit Series" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Edit Series" />
        <EmptyState
          title="Series not found"
          description={fetchError || "The requested series could not be loaded."}
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  return <AdminSermonSeriesAdd existing={series} />;
}
