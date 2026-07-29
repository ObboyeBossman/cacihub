"use client";

import { useEffect, useState } from "react";
import {
  BookOpen, Plus, Search, Calendar, ChevronRight,
  Layers, CheckCircle2, Clock, Music,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { SermonSeriesDTO } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  CACIButton, CACICard, CACISkeleton, EmptyState, CACIInput,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";

export function AdminSermons() {
  const { navigate, setParam } = useApp();
  const [series, setSeries] = useState<SermonSeriesDTO[] | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.sermonSeries.list();
        if (mounted) setSeries(res.series);
      } catch {
        if (mounted) setSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = (series || []).filter((s) =>
    !query.trim() ||
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    (s.theme || "").toLowerCase().includes(query.toLowerCase()) ||
    String(s.year).includes(query)
  );

  const ongoing = filtered.filter((s) => s.status === "ongoing");
  const completed = filtered.filter((s) => s.status === "completed");

  function openSeries(id: string) {
    setParam("seriesId", id);
    navigate("admin-sermon-series-detail");
  }

  return (
    <>
      <MobileHeader title="Sermons" subtitle={`${series?.length ?? 0} series`} />
      <DesktopTopBar
        title="Sermon Series"
        subtitle="Manage series collections and individual messages"
        action={
          <CACIButton
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => navigate("admin-sermon-series-add")}
          >
            New Series
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-5xl space-y-5">
        <CACIInput
          placeholder="Search by title, theme, year…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search size={18} />}
          containerClassName="mb-0"
        />

        <div className="md:hidden">
          <CACIButton
            className="w-full"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate("admin-sermon-series-add")}
          >
            New Series
          </CACIButton>
        </div>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} padding="none" className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  <CACISkeleton className="h-20 w-28 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <CACISkeleton className="h-4 w-1/2" />
                    <CACISkeleton className="h-3 w-1/3" />
                    <CACISkeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<BookOpen size={28} />}
            title={query ? "No series match your search" : "No sermon series yet"}
            description={
              query
                ? "Try a different search term."
                : "Create your first series to organise messages by theme or campaign."
            }
            action={
              !query ? (
                <CACIButton
                  leftIcon={<Plus size={16} />}
                  onClick={() => navigate("admin-sermon-series-add")}
                >
                  New Series
                </CACIButton>
              ) : undefined
            }
          />
        )}

        {!loading && ongoing.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-caci-blue" />
              <h2 className="text-[13px] font-semibold text-n600 uppercase tracking-wide">Ongoing</h2>
            </div>
            <div className="space-y-2">
              {ongoing.map((s) => (
                <SeriesRow key={s.id} series={s} onClick={() => openSeries(s.id)} />
              ))}
            </div>
          </section>
        )}

        {!loading && completed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <h2 className="text-[13px] font-semibold text-n600 uppercase tracking-wide">Completed</h2>
            </div>
            <div className="space-y-2">
              {completed.map((s) => (
                <SeriesRow key={s.id} series={s} onClick={() => openSeries(s.id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function SeriesRow({ series, onClick }: { series: SermonSeriesDTO; onClick: () => void }) {
  const isOngoing = series.status === "ongoing";
  return (
    <CACICard padding="none" hover onClick={onClick} className="overflow-hidden cursor-pointer group">
      <div className="flex items-stretch">
        <div className="w-24 md:w-32 shrink-0 relative bg-gradient-to-br from-caci-blue to-[#003578] flex items-center justify-center min-h-[80px]">
          {series.coverImage ? (
            <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <Layers size={28} className="text-white/60" />
          )}
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isOngoing ? "bg-caci-blue text-white" : "bg-white/90 text-n600"
            }`}
          >
            {isOngoing ? "LIVE" : series.year}
          </span>
        </div>
        <div className="flex-1 min-w-0 p-3 md:p-4 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-n900 text-[15px] leading-snug line-clamp-1 group-hover:text-caci-blue transition-colors">
                {series.title}
              </h3>
              {series.theme && (
                <p className="text-[12px] text-caci-blue font-medium mt-0.5">{series.theme}</p>
              )}
            </div>
            <ChevronRight size={16} className="text-n300 group-hover:text-caci-blue transition-colors shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[12px] text-n500">
              <Music size={11} />
              {series.sermonCount ?? 0} sermon{series.sermonCount !== 1 ? "s" : ""}
            </span>
            {series.startDate && (
              <span className="inline-flex items-center gap-1 text-[12px] text-n400">
                <Calendar size={11} />
                {formatDate(series.startDate)}
              </span>
            )}
            {series.anchorText && (
              <span className="text-[12px] text-n400 italic truncate hidden md:block">
                📖 {series.anchorText}
              </span>
            )}
          </div>
        </div>
      </div>
    </CACICard>
  );
}
