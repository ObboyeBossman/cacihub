"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO } from "@/lib/types";
import { AdminSermonAdd } from "./AdminSermonAdd";
import { CACISkeleton, CACICard, EmptyState, CACIButton } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function AdminSermonEdit() {
  const { params, back, setAdminMobileMenuOpen } = useApp();
  const sermonId = params.sermonId;

  const [sermon, setSermon] = useState<SermonDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!sermonId) { back(); return; }
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermons.get(sermonId);
        if (mounted) setSermon(res.sermon);
      } catch (e: any) {
        if (mounted) setFetchError(e?.message || "Failed to load sermon");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sermonId, back]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Edit Sermon" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Edit Sermon" subtitle="Loading sermon…" />
        <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-2xl space-y-4">
          <CACICard>
            <div className="space-y-3">
              <CACISkeleton className="h-5 w-1/2" />
              <CACISkeleton className="h-10 w-full" />
              <CACISkeleton className="h-10 w-full" />
              <CACISkeleton className="h-24 w-full" />
            </div>
          </CACICard>
          <CACICard>
            <CACISkeleton className="h-5 w-1/3 mb-4" />
            <CACISkeleton className="h-10 w-full" />
          </CACICard>
        </div>
      </>
    );
  }

  if (fetchError || !sermon) {
    return (
      <>
        <MobileHeader title="Edit Sermon" onBack={back} onMenu={() => setAdminMobileMenuOpen(true)} />
        <DesktopTopBar title="Edit Sermon" />
        <EmptyState
          title="Sermon not found"
          description={fetchError || "The requested sermon could not be loaded."}
          action={<CACIButton onClick={back}>Go back</CACIButton>}
        />
      </>
    );
  }

  return <AdminSermonAdd existing={sermon} />;
}
