"use client";

import { useEffect, useState } from "react";
import {
  Bell, Calendar, BookOpen, Radio, ChevronRight, Clock,
  Users, AlertCircle, Sparkles, ArrowUpRight, MapPin, Mic,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblyEventDTO, SermonDTO, AssemblySettingsDTO, MemberDTO } from "@/lib/types";
import { EVENT_CATEGORY_COLORS, EVENT_CATEGORY_LABELS } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { CACISkeleton, EmptyState, CaciAvatar } from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Days until a future date, rounded down. Negative = past. */
function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MemberDashboard() {
  const { user, navigate, setParam } = useApp();

  const [loading, setLoading]           = useState(true);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<AssemblyEventDTO[]>([]);
  const [recentSermons, setRecentSermons]   = useState<SermonDTO[]>([]);
  const [settings, setSettings]         = useState<AssemblySettingsDTO | null>(null);
  const [member, setMember]             = useState<MemberDTO | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [notifRes, eventsRes, sermonsRes, settingsRes, memberRes] = await Promise.all([
          user?.memberId
            ? api.notifications.list(user.memberId, true).catch(() => ({ notifications: [] }))
            : Promise.resolve({ notifications: [] }),
          api.events.list({ upcoming: true, limit: 5 }).catch(() => ({ events: [] })),
          api.sermons.list().catch(() => ({ sermons: [] })),
          api.settings.get().catch(() => ({ settings: null })),
          user?.memberId
            ? api.members.get(user.memberId).catch(() => ({ member: null }))
            : Promise.resolve({ member: null }),
        ]);
        if (!mounted) return;
        setUnreadCount(notifRes.notifications.length);
        setUpcomingEvents(eventsRes.events);
        setRecentSermons(sermonsRes.sermons.slice(0, 3));
        setSettings(settingsRes.settings);
        setMember(memberRes.member);
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.memberId]);

  // Profile completeness
  const missingFields: string[] = [];
  if (member) {
    if (!member.phoneNumber)  missingFields.push("phone");
    if (!member.dateOfBirth)  missingFields.push("date of birth");
    if (!member.location)     missingFields.push("location");
    if (!member.gender)       missingFields.push("gender");
  }
  const showProfilePrompt = !loading && member && missingFields.length > 0;

  const firstName    = user?.fullName?.split(" ")[0] || "Friend";
  const assemblyName = settings?.assemblyName || "Assakae Central Assembly";

  // Next upcoming event for the hero banner
  const nextEvent = upcomingEvents[0] ?? null;
  const nextEventDays = nextEvent ? daysUntil(nextEvent.startDate) : null;

  return (
    <>
      <MobileHeader title="Home" />
      <DesktopTopBar title="Home" subtitle={assemblyName} />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl space-y-4">

        {/* ── HERO GREETING ── */}
        <div className="rounded-2xl bg-gradient-to-br from-[#004ba0] to-[#002d6b] p-5 text-white relative overflow-hidden">
          {/* Decorative rings */}
          <div className="absolute -right-10 -top-10 size-40 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute -right-4 -top-4 size-24 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute right-8 bottom-0 size-16 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            {/* Left: avatar + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                {member?.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profilePhotoUrl}
                    alt={user?.fullName}
                    className="size-12 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[15px] font-bold shrink-0 select-none">
                    {user?.fullName?.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-white/60 leading-none mb-0.5">
                  Hi, {firstName} 👋
                </p>
                <h1 className="text-[20px] font-bold leading-tight truncate">{getGreeting()}</h1>
              </div>
            </div>

            {/* Right: notification bell */}
            <button
              onClick={() => navigate("member-inbox")}
              className="relative shrink-0 size-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Inbox"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-caci-red" />
              )}
            </button>
          </div>

          {/* Sparkle assembly name */}
          <p className="relative mt-3 text-[12px] text-white/50 flex items-center gap-1.5">
            <Sparkles size={11} />
            {assemblyName}
          </p>
        </div>

        {/* ── PROFILE COMPLETION PROMPT ── */}
        {showProfilePrompt && (
          <div className="rounded-xl bg-[#fff8c5] border border-[#9a6700]/20 px-3.5 py-3 flex items-center gap-2.5 animate-fade-in">
            <AlertCircle size={17} className="text-[#9a6700] shrink-0" />
            <p className="flex-1 text-[13px] text-[#9a6700] font-medium min-w-0">
              Complete your profile — missing: {missingFields.join(", ")}
            </p>
            <button
              onClick={() => navigate("member-profile-edit")}
              className="shrink-0 text-[12px] font-bold text-[#9a6700] hover:underline"
            >
              Update
            </button>
          </div>
        )}

        {/* ── NEXT SERVICE STAT BANNER ── */}
        {loading ? (
          <CACISkeleton className="h-16 rounded-2xl" />
        ) : nextEvent ? (
          <button
            onClick={() => { setParam("eventId", nextEvent.id); navigate("member-events"); }}
            className="w-full flex items-center gap-3.5 rounded-2xl bg-n900 px-4 py-4 text-left hover:bg-n700 active:bg-night transition-colors group"
          >
            <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-tight truncate">{nextEvent.title}</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                {nextEventDays === 0
                  ? "Today"
                  : nextEventDays === 1
                  ? "Tomorrow"
                  : nextEventDays !== null && nextEventDays > 0
                  ? `In ${nextEventDays} days`
                  : formatRelative(nextEvent.startDate)}
              </p>
            </div>
            <ChevronRight size={18} className="text-white/40 shrink-0 group-hover:text-white/70 transition-colors" />
          </button>
        ) : null}

        {/* ── QUICK ACCESS ── */}
        <section>
          <p className="text-[13px] font-semibold text-n500 mb-2.5 px-0.5">Quick Access</p>
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-caci -mx-4 px-4">
            <QuickAccessCard
              icon={<BookOpen size={22} />}
              label="Sermons"
              dark
              onClick={() => navigate("member-sermons")}
            />
            <QuickAccessCard
              icon={<Calendar size={22} />}
              label="Events"
              onClick={() => navigate("member-events")}
            />
            <QuickAccessCard
              icon={<Radio size={22} />}
              label="Broadcasts"
              onClick={() => navigate("member-broadcasts")}
            />
            <QuickAccessCard
              icon={<Users size={22} />}
              label="Groups"
              onClick={() => navigate("member-groups")}
            />
          </div>
        </section>

        {/* ── ROOMS-STYLE "WHAT'S ON" CARD ── */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p className="text-[13px] font-semibold text-n500">What&apos;s On</p>
            <button
              onClick={() => navigate("member-events")}
              className="text-[12px] font-semibold text-caci-blue hover:underline"
            >
              See all
            </button>
          </div>

          {loading ? (
            <CACISkeleton className="h-52 rounded-2xl" />
          ) : upcomingEvents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-caci -mx-4 px-4">
              {upcomingEvents.map((event) => (
                <WhatsOnCard
                  key={event.id}
                  event={event}
                  onClick={() => { setParam("eventId", event.id); navigate("member-events"); }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-n100 py-8">
              <EmptyState
                icon={<Calendar size={22} />}
                title="No upcoming events"
                description="Check back soon for new services."
              />
            </div>
          )}
        </section>

        {/* ── RECENT SERMONS ── */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p className="text-[13px] font-semibold text-n500">Recent Sermons</p>
            <button
              onClick={() => navigate("member-sermons")}
              className="text-[12px] font-semibold text-caci-blue hover:underline"
            >
              See all
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <CACISkeleton key={i} className="h-[72px] rounded-2xl" />)}
            </div>
          ) : recentSermons.length > 0 ? (
            <div className="space-y-2">
              {recentSermons.map((sermon, i) => (
                <SermonRow
                  key={sermon.id}
                  sermon={sermon}
                  index={i}
                  onClick={() => { setParam("sermonId", sermon.id); navigate("member-sermon-detail"); }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-n100 py-8">
              <EmptyState
                icon={<BookOpen size={22} />}
                title="No sermons yet"
                description="Sermons will appear here once published."
              />
            </div>
          )}
        </section>

        {/* bottom padding for nav bar */}
        <div className="h-4" />
      </div>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuickAccessCard({
  icon,
  label,
  dark = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  dark?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start shrink-0 w-[110px] flex flex-col items-start justify-between rounded-2xl p-4 h-[110px] transition-all active:scale-95",
        dark
          ? "bg-n900 text-white hover:bg-n700"
          : "bg-white border border-n100 text-n700 hover:border-caci-blue hover:text-caci-blue card-hover",
      )}
    >
      <div className={cn("size-9 rounded-xl flex items-center justify-center", dark ? "bg-white/10" : "bg-n50")}>
        {icon}
      </div>
      <p className="text-[13px] font-semibold mt-auto">{label}</p>
    </button>
  );
}

function WhatsOnCard({
  event,
  onClick,
}: {
  event: AssemblyEventDTO;
  onClick: () => void;
}) {
  const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
  const d = new Date(event.startDate);
  const dateLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  const timeLabel = event.isAllDay
    ? "All day"
    : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <button
      onClick={onClick}
      className="snap-start shrink-0 w-[260px] relative rounded-2xl overflow-hidden bg-n900 h-52 flex flex-col justify-end active:scale-95 transition-transform"
    >
      {/* Placeholder image background — gradient + pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#004ba0]/80 to-[#002d6b]/90">
        {/* Decorative dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
      </div>

      {/* Category badge top-left */}
      <div className="absolute top-3 left-3">
        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", colors.bg, colors.text)}>
          {EVENT_CATEGORY_LABELS[event.category] || event.category}
        </span>
      </div>

      {/* Arrow top-right */}
      <div className="absolute top-3 right-3 size-7 rounded-full bg-white/20 flex items-center justify-center">
        <ArrowUpRight size={14} className="text-white" />
      </div>

      {/* Bottom info overlay */}
      <div className="relative px-3.5 pb-3.5 pt-8 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-[15px] font-bold text-white leading-tight">{event.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Calendar size={11} />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Clock size={11} />
            {timeLabel}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 text-[11px] text-white/70 truncate max-w-[120px]">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SermonRow({
  sermon,
  index,
  onClick,
}: {
  sermon: SermonDTO;
  index: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-white border border-n100 px-4 py-3 text-left hover:border-caci-blue card-hover active:scale-[0.99] transition-all animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Icon */}
      <div className="shrink-0 size-11 rounded-xl bg-gradient-to-br from-caci-blue to-[#002d6b] flex items-center justify-center text-white">
        <Mic size={18} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-n900 truncate">{sermon.title}</p>
        <p className="text-[12px] text-n400 truncate mt-0.5">
          {sermon.speaker} · {formatRelative(sermon.date)}
        </p>
      </div>

      <ChevronRight size={16} className="text-n300 shrink-0" />
    </button>
  );
}
