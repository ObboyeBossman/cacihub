"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, MapPin, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblyEventDTO } from "@/lib/types";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_COLORS } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, CACIButton,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

export function MemberEvents() {
  const { back } = useApp();
  const [events, setEvents] = useState<AssemblyEventDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AssemblyEventDTO | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.events.list({ upcoming: true, limit: 50 });
      setEvents(res.events);
    } catch (e: any) {
      setError(e?.message || "Failed to load events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <MobileHeader title="Events" onBack={back} />
      <DesktopTopBar title="Events" subtitle="Upcoming assembly services and meetings" onBack={back} />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl space-y-4">
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <CACICard key={i} className="flex gap-3">
                <CACISkeleton className="h-16 w-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <CACISkeleton className="h-4 w-2/3" />
                  <CACISkeleton className="h-3 w-1/2" />
                  <CACISkeleton className="h-3 w-1/3" />
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load events"
            description={error}
            action={<CACIButton onClick={load}>Try again</CACIButton>}
          />
        )}

        {!loading && !error && events && events.length === 0 && (
          <EmptyState
            icon={<Calendar size={26} />}
            title="No upcoming events"
            description="There are no scheduled events right now. Check back soon."
          />
        )}

        {!loading && !error && events && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <EventListItem
                key={event.id}
                event={event}
                index={idx}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {selectedEvent && (
        <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </>
  );
}

function EventListItem({
  event,
  index,
  onClick,
}: {
  event: AssemblyEventDTO;
  index: number;
  onClick: () => void;
}) {
  const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
  const start = new Date(event.startDate);
  const day = start.getDate();
  const month = start.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
  const time = event.isAllDay
    ? "All day"
    : start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <CACICard
      padding="default"
      hover
      onClick={onClick}
      className="flex gap-3 animate-stagger"
      style={{ ["--stagger-i" as string]: Math.min(index, 8) }}
    >
      <div className={cn("shrink-0 w-14 rounded-lg flex flex-col items-center justify-center py-2", colors.bg)}>
        <span className={cn("text-[18px] font-bold leading-none", colors.text)}>{day}</span>
        <span className={cn("text-[10px] font-semibold mt-0.5", colors.text)}>{month}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[15px] font-semibold text-n900 leading-snug line-clamp-1">{event.title}</h3>
        <div className="flex items-center gap-3 mt-1 flex-wrap text-[12px] text-n400">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {time}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-n300 shrink-0 self-center" />
    </CACICard>
  );
}

function EventDetailSheet({ event, onClose }: { event: AssemblyEventDTO; onClose: () => void }) {
  const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
  const start = new Date(event.startDate);
  const day = start.getDate();
  const month = start.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scroll-caci shadow-xl animate-slide-up md:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored header */}
        <div className={cn("px-5 py-5 rounded-t-2xl", colors.bg)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/70", colors.text)}>
                <span className={cn("size-1.5 rounded-full", colors.dot)} />
                {EVENT_CATEGORY_LABELS[event.category] || event.category}
              </span>
              <h2 className="text-[20px] font-bold text-n900 mt-2 leading-tight">{event.title}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Date / time */}
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-lg bg-n50 flex flex-col items-center justify-center shrink-0">
              <span className="text-[16px] font-bold text-n900 leading-none">{day}</span>
              <span className="text-[10px] font-semibold text-n500 mt-0.5">{month.split(" ")[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-n900">
                {event.isAllDay ? "All day" : formatDateTime(event.startDate)}
              </p>
              {event.endDate && (
                <p className="text-[12px] text-n400">
                  until {formatDateTime(event.endDate)}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-[14px] text-n700">
              <MapPin size={16} className="text-n400 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-n100">
              <p className="text-[13px] font-medium text-n500 mb-1">Details</p>
              <p className="text-[14px] text-n700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Created by */}
          {event.createdByName && (
            <p className="text-[12px] text-n400 pt-2 border-t border-n100">
              Posted by {event.createdByName}
            </p>
          )}
        </div>

        {/* Close button */}
        <div className="sticky bottom-0 bg-white border-t border-n100 px-5 py-3">
          <CACIButton className="w-full" onClick={onClose}>Close</CACIButton>
        </div>
      </div>
    </div>
  );
}
