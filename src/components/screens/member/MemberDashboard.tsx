"use client";

import { useEffect, useState } from "react";
import {
  Bell, Calendar, BookOpen, Radio, ChevronRight, Clock, MapPin, TrendingUp, Sparkles, Users, AlertCircle, Search,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblyEventDTO, SermonDTO, AssemblySettingsDTO, MemberDTO } from "@/lib/types";
import { EVENT_CATEGORY_COLORS, EVENT_CATEGORY_LABELS } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import {
  CACICard, CACISkeleton, EmptyState, CaciAvatar, CACIButton, SectionHeading,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

export function MemberDashboard() {
  const { user, navigate, setParam, setSearchOpen } = useApp();
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<AssemblyEventDTO[]>([]);
  const [recentSermons, setRecentSermons] = useState<SermonDTO[]>([]);
  const [settings, setSettings] = useState<AssemblySettingsDTO | null>(null);
  const [member, setMember] = useState<MemberDTO | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [notifRes, eventsRes, sermonsRes, settingsRes, memberRes] = await Promise.all([
          user?.memberId
            ? api.notifications.list(user.memberId, true).catch(() => ({ notifications: [] }))
            : Promise.resolve({ notifications: [] }),
          api.events.list({ upcoming: true, limit: 3 }).catch(() => ({ events: [] })),
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
      } catch {} finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.memberId]);

  // Profile completeness check — prompt the member to fill in missing fields.
  const missingFields: string[] = [];
  if (member) {
    if (!member.phoneNumber) missingFields.push("phone number");
    if (!member.dateOfBirth) missingFields.push("date of birth");
    if (!member.location) missingFields.push("location");
    if (!member.gender) missingFields.push("gender");
  }
  const showProfilePrompt = !loading && member && missingFields.length > 0;

  const firstName = user?.fullName?.split(" ")[0] || "Friend";
  const assemblyName = settings?.assemblyName || "Assakae Central Assembly";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <>
      <MobileHeader title="Home" />
      <DesktopTopBar title="Home" subtitle={assemblyName} />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-4xl space-y-5">
        {/* Hero greeting */}
        <div className="rounded-2xl bg-gradient-to-br from-caci-blue to-caci-blue-dim p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
          }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              {user && (
                <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-[16px] font-bold shrink-0">
                  {user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] text-white/70">{greeting},</p>
                <h1 className="text-[22px] font-bold leading-tight truncate">{firstName} 👋</h1>
              </div>
            </div>
            <p className="text-[13px] text-white/80 mt-1 flex items-center gap-1.5">
              <Sparkles size={13} />
              {assemblyName}
            </p>
          </div>
        </div>

        {/* Mobile search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden flex items-center gap-2 w-full h-11 px-3 rounded-lg border border-n100 bg-white text-n400 text-[14px] hover:border-caci-blue hover:text-caci-blue transition-colors"
        >
          <Search size={17} />
          <span className="flex-1 text-left">Search assembly…</span>
        </button>

        {/* Profile completion prompt */}
        {showProfilePrompt && (
          <div className="rounded-lg bg-[#fff8c5] border border-[#9a6700]/20 p-3 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle size={18} className="text-[#9a6700] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#9a6700]">Complete your profile</p>
              <p className="text-[12px] text-[#9a6700]/80 mt-0.5">
                Your profile is missing: {missingFields.join(", ")}.
              </p>
            </div>
            <button
              onClick={() => navigate("member-profile-edit")}
              className="shrink-0 text-[12px] font-semibold text-[#9a6700] hover:underline whitespace-nowrap"
            >
              Update
            </button>
          </div>
        )}

        {/* Quick stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <CACISkeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <QuickStat
              icon={<Bell size={18} />}
              label="Unread"
              value={unreadCount}
              accent="red"
              onClick={() => navigate("member-inbox")}
            />
            <QuickStat
              icon={<Calendar size={18} />}
              label="Events"
              value={upcomingEvents.length}
              accent="blue"
              onClick={() => navigate("member-events")}
            />
            <QuickStat
              icon={<BookOpen size={18} />}
              label="Sermons"
              value={recentSermons.length}
              accent="green"
              onClick={() => navigate("member-sermons")}
            />
          </div>
        )}

        {/* Upcoming events */}
        <section>
          <SectionHeading
            title="Upcoming Events"
            className="mb-3"
            action={
              <button
                onClick={() => navigate("member-events")}
                className="text-[13px] font-medium text-caci-blue hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight size={14} />
              </button>
            }
          />
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <CACICard key={i} className="flex gap-3">
                  <CACISkeleton className="h-14 w-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <CACISkeleton className="h-4 w-2/3" />
                    <CACISkeleton className="h-3 w-1/2" />
                  </div>
                </CACICard>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.map((event) => {
                const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
                const d = new Date(event.startDate);
                return (
                  <CACICard
                    key={event.id}
                    padding="default"
                    hover
                    onClick={() => { setParam("eventId", event.id); navigate("member-events"); }}
                    className="flex items-center gap-3 animate-stagger"
                  >
                    <div className={cn("shrink-0 w-12 rounded-lg flex flex-col items-center justify-center py-1.5", colors.bg)}>
                      <span className={cn("text-[16px] font-bold leading-none", colors.text)}>{d.getDate()}</span>
                      <span className={cn("text-[9px] font-semibold mt-0.5", colors.text)}>
                        {d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-n900 truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[12px] text-n400">
                        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", colors.bg, colors.text)}>
                          {EVENT_CATEGORY_LABELS[event.category] || event.category}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {event.isAllDay ? "All day" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </CACICard>
                );
              })}
            </div>
          ) : (
            <CACICard>
              <EmptyState
                icon={<Calendar size={22} />}
                title="No upcoming events"
                description="Check back soon for new services and meetings."
              />
            </CACICard>
          )}
        </section>

        {/* Recent sermons */}
        <section>
          <SectionHeading
            title="Recent Sermons"
            className="mb-3"
            action={
              <button
                onClick={() => navigate("member-sermons")}
                className="text-[13px] font-medium text-caci-blue hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight size={14} />
              </button>
            }
          />
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <CACICard key={i} className="flex gap-3">
                  <CACISkeleton className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <CACISkeleton className="h-4 w-3/4" />
                    <CACISkeleton className="h-3 w-1/2" />
                  </div>
                </CACICard>
              ))}
            </div>
          ) : recentSermons.length > 0 ? (
            <div className="space-y-2">
              {recentSermons.map((sermon) => (
                <CACICard
                  key={sermon.id}
                  padding="default"
                  hover
                  onClick={() => { setParam("sermonId", sermon.id); navigate("member-sermon-detail"); }}
                  className="flex items-center gap-3 animate-stagger"
                >
                  <div className="shrink-0 size-12 rounded-lg bg-gradient-to-br from-caci-blue to-caci-blue-dim flex items-center justify-center text-white">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-n900 truncate">{sermon.title}</p>
                    <p className="text-[12px] text-n400 truncate">
                      {sermon.speaker} · {formatRelative(sermon.date)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-n300 shrink-0" />
                </CACICard>
              ))}
            </div>
          ) : (
            <CACICard>
              <EmptyState
                icon={<BookOpen size={22} />}
                title="No sermons available"
                description="Sermons will appear here once published."
              />
            </CACICard>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <SectionHeading title="Quick Actions" className="mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <CACIButton
              variant="secondary"
              className="h-auto py-4 flex-col gap-1.5"
              leftIcon={<Radio size={20} />}
              onClick={() => navigate("member-broadcasts")}
            >
              <span className="text-[13px]">Broadcasts</span>
            </CACIButton>
            <CACIButton
              variant="secondary"
              className="h-auto py-4 flex-col gap-1.5"
              leftIcon={<Users size={20} />}
              onClick={() => navigate("member-groups")}
            >
              <span className="text-[13px]">Groups & Chat</span>
            </CACIButton>
          </div>
        </section>
      </div>
    </>
  );
}

function QuickStat({
  icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "red" | "blue" | "green";
  onClick?: () => void;
}) {
  const styles = {
    red: "bg-caci-red-bg text-caci-red",
    blue: "bg-caci-blue-bg text-caci-blue",
    green: "bg-[#dafbe1] text-[#1a7f37]",
  }[accent];
  return (
    <CACICard padding="default" hover={!!onClick} onClick={onClick} className="flex flex-col items-center text-center gap-1.5">
      <div className={cn("size-9 rounded-lg flex items-center justify-center", styles)}>
        {icon}
      </div>
      <p className="text-[20px] font-bold text-n900 leading-none">{value}</p>
      <p className="text-[11px] text-n400 font-medium">{label}</p>
    </CACICard>
  );
}
