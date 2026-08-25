"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Calendar, ChevronRight, Mic } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CACIButton, CACICard, CACISkeleton, EmptyState, HeaderAddButton } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function AdminSermons() {
  const { navigate, setParam, setAdminMobileMenuOpen } = useApp();
  const [sermons, setSermons] = useState<SermonDTO[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermons.list();
        if (mounted) setSermons(res.sermons);
      } catch {
        if (mounted) setSermons([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const list = sermons || [];

  const goToDetail = (id: string) => {
    setParam("sermonId", id);
    navigate("admin-sermon-detail");
  };

  return (
    <>
      <MobileHeader
        title="Sermons"
        subtitle={`${list.length} ${list.length === 1 ? "message" : "messages"}`}
        onMenu={() => setAdminMobileMenuOpen(true)}
        action={
          <HeaderAddButton
            onClick={() => navigate("admin-sermon-add")}
            label="New sermon"
          />
        }
      />
      <DesktopTopBar
        title="Sermons"
        subtitle="Manage sermon recordings and teachings"
        action={
          <CACIButton size="sm" leftIcon={<Plus size={15} />} onClick={() => navigate("admin-sermon-add")}>
            New Sermon
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-5">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} padding="none" className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-slate-200 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
                  </div>
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <EmptyState
              icon={<BookOpen size={28} />}
              title="No sermons found"
            />
          </div>
        )}

        {!loading && list.length > 0 && (
          <div className="space-y-2">
            {list.map((sermon) => (
              <CACICard key={sermon.id} padding="none" hover onClick={() => goToDetail(sermon.id)} className="overflow-hidden cursor-pointer group">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[12px] text-caci-blue mb-1">
                      <Calendar size={11} />
                      {formatDate(sermon.date)}
                    </div>
                    <h3 className="font-semibold text-n900 text-[15px] leading-snug line-clamp-1">{sermon.title}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px] text-n500">
                      <span className="inline-flex items-center gap-1"><Mic size={11} /> {sermon.speaker}</span>
                      {sermon.scriptureReference && <span>{sermon.scriptureReference}</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-n300 group-hover:text-caci-blue transition-colors shrink-0" />
                </div>
              </CACICard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
