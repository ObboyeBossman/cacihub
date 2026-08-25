"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, Calendar, ChevronRight, Mic } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonDTO } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CACICard, CACISkeleton, EmptyState, CACIInput, SermonCover } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function MemberSermons() {
  const { navigate, setParam } = useApp();
  const [sermons, setSermons] = useState<SermonDTO[] | null>(null);
  const [query, setQuery] = useState("");
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

  const q = query.trim().toLowerCase();
  const filtered = (sermons || []).filter((s) =>
    !q ||
    s.title.toLowerCase().includes(q) ||
    s.speaker.toLowerCase().includes(q) ||
    (s.theme || "").toLowerCase().includes(q) ||
    (s.scriptureReference || "").toLowerCase().includes(q) ||
    (s.summary || "").toLowerCase().includes(q)
  );

  function openSermon(sermonId: string) {
    setParam("sermonId", sermonId);
    navigate("member-sermon-detail");
  }

  return (
    <>
      <MobileHeader title="Sermons" subtitle={sermons ? `${sermons.length} messages` : "Loading…"} />
      <DesktopTopBar title="Sermons" subtitle="Listen to messages from your assembly" />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl">
        <div className="mb-5">
          <CACIInput placeholder="Search sermons, speakers, scriptures…" value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={18} />} containerClassName="mb-0" />
        </div>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} padding="none" className="overflow-hidden">
                <CACISkeleton className="h-32 w-full" />
              </CACICard>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState icon={<BookOpen size={26} />} title={q ? "No sermons match your search" : "No sermons yet"} description={q ? "Try a different search term." : "Check back soon for recorded messages."} />
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((sermon) => (
              <CACICard key={sermon.id} padding="none" hover onClick={() => openSermon(sermon.id)} className="cursor-pointer overflow-hidden group border border-border/80">
                <div className="flex flex-col sm:flex-row">
                  <SermonCover
                    coverImageUrl={sermon.coverImageUrl}
                    title={sermon.title}
                    className="w-full sm:w-48 h-40 sm:h-auto min-h-[140px]"
                    logoSize={52}
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-caci-blue">
                          <Calendar size={11} />
                          {formatDate(sermon.date)}
                        </span>
                        <ChevronRight size={16} className="text-n300 group-hover:text-caci-blue transition-colors shrink-0" />
                      </div>
                      <h3 className="text-[16px] font-semibold text-n900 leading-snug">{sermon.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-n500">
                        <span className="inline-flex items-center gap-1"><Mic size={11} /> {sermon.speaker}</span>
                        {sermon.scriptureReference && <span>{sermon.scriptureReference}</span>}
                      </div>
                      {sermon.summary && <p className="mt-2 text-[13px] text-n600 line-clamp-2 leading-relaxed">{sermon.summary}</p>}
                    </div>
                  </div>
                </div>
              </CACICard>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
