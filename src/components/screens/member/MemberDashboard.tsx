"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Heart,
  Calendar,
  BookOpen,
  Users,
  ChevronRight,
  Wifi,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { AssemblyEventDTO, SermonDTO, AssemblySettingsDTO, MemberDTO } from "@/lib/types";
import { DesktopTopBar } from "@/components/caci/nav";

// ─── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MemberDashboard() {
  const { user, navigate, setParam } = useApp();

  const [loading, setLoading]               = useState(true);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<AssemblyEventDTO[]>([]);
  const [recentSermons, setRecentSermons]   = useState<SermonDTO[]>([]);
  const [settings, setSettings]             = useState<AssemblySettingsDTO | null>(null);
  const [member, setMember]                 = useState<MemberDTO | null>(null);

  // UI state
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);
  const [givingModal, setGivingModal]         = useState(false);
  const [selectedEvent, setSelectedEvent]     = useState<AssemblyEventDTO | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [donationAmount, setDonationAmount]   = useState("50");
  const [activeTab, setActiveTab]             = useState("home");

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

  const firstName    = user?.fullName?.split(" ")[0] || "Friend";
  const honorific    = member?.gender === "Female" ? "Sister" : "Brother";
  const displayName  = `${honorific} ${firstName}`;
  const assemblyName = settings?.assemblyName || "Assakae Central Assembly";

  const nextEvent = upcomingEvents[0] ?? null;

  // Notification items — real unread count badge, list from API if available
  const notificationItems = [
    {
      id: 1,
      title: assemblyName,
      desc: nextEvent ? `Next: ${nextEvent.title}` : "Stay connected with your church family.",
      time: "Now",
    },
    ...(unreadCount > 1
      ? [{ id: 2, title: "Inbox", desc: `You have ${unreadCount} unread messages.`, time: "Recent" }]
      : []),
  ];

  return (
    <>
      {/* Desktop top bar — hidden on mobile */}
      <DesktopTopBar title="Home" subtitle={assemblyName} />

      {/* ── MOBILE VIEW ── */}
      <div className="md:hidden min-h-screen bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-start p-4 select-none">
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-blue-500/20 overflow-hidden relative flex flex-col min-h-[820px]">

          {/* Status Bar */}
          <div className="pt-4 px-8 pb-1 flex justify-between items-center text-xs font-bold text-slate-900 z-30 bg-white/90 backdrop-blur-md">
            <span>
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
            <div className="flex items-center space-x-1.5">
              <Wifi className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <div className="w-4 h-2.5 border border-slate-900 rounded-sm p-[1px] flex items-center">
                <div className="w-full h-full bg-slate-900 rounded-[0.5px]" />
              </div>
            </div>
          </div>

          {/* TOP HEADER */}
          <div className="px-6 pt-3 pb-3 flex items-center justify-between z-20 bg-white/90 backdrop-blur-md">
            <div className="flex items-center space-x-3.5">
              <div className="relative group cursor-pointer" onClick={() => navigate("member-profile")}>
                {member?.profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.profilePhotoUrl}
                    alt={user?.fullName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-blue-400 shadow-md group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-blue-100 border-2 border-blue-400 shadow-md flex items-center justify-center text-[15px] font-bold text-blue-700 group-hover:scale-110 transition-transform duration-300">
                    {user?.fullName?.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="text-xs text-blue-600 flex items-center gap-1 font-semibold tracking-wide">
                  Welcome back <span className="animate-bounce inline-block">🙏</span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{displayName}</h1>
              </div>
            </div>

            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-3 rounded-full bg-blue-50 hover:bg-blue-100 transition-all active:scale-90 shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white animate-bounce" />
              )}
            </button>
          </div>

          {/* NOTIFICATION PANEL */}
          {notificationsOpen && (
            <div className="absolute top-24 inset-x-4 z-50 bg-white/95 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Church Announcements</h3>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-blue-600 px-3 py-1 rounded-full bg-blue-50"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {notificationItems.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-blue-50/50 hover:bg-blue-50 transition-all rounded-2xl flex flex-col gap-1 border border-blue-100"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-900">{n.title}</span>
                      <span className="text-[10px] font-medium text-blue-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{n.desc}</p>
                  </div>
                ))}
                {notificationItems.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No announcements right now.</p>
                )}
              </div>
            </div>
          )}

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-28 space-y-6" style={{ scrollbarWidth: "none" }}>

            {/* TITHES & OFFERINGS BANNER */}
            <div
              onClick={() => setGivingModal(true)}
              className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-5 py-4 rounded-[28px] flex items-center justify-between cursor-pointer hover:brightness-110 transition-all duration-300 active:scale-[0.98] shadow-xl shadow-blue-900/30 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Heart className="w-5 h-5 text-blue-200 fill-blue-200 animate-pulse" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight">Tithes &amp; Offering</span>
                  <p className="text-[11px] text-blue-200 font-medium">Support God&apos;s mission today</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1.5 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* GIVING MODAL */}
            {givingModal && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
                <div className="bg-white w-full rounded-t-[36px] p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Online Giving</h3>
                    <button
                      onClick={() => setGivingModal(false)}
                      className="text-xs font-semibold text-blue-600 px-3 py-1 rounded-full bg-blue-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["25", "50", "100"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDonationAmount(amt)}
                        className={`py-3 rounded-2xl font-bold text-sm border transition-all ${
                          donationAmount === amt
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        GH₵{amt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setGivingModal(false)}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform text-sm"
                  >
                    Proceed to Give (GH₵{donationAmount})
                  </button>
                </div>
              </div>
            )}

            {/* QUICK ACCESS — HORIZONTAL TILES */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Member Portal</h2>
                <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                  Swipe <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div className="flex space-x-3.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>

                {/* Sermons */}
                <div
                  onClick={() => navigate("member-sermons")}
                  className="w-[124px] h-[142px] bg-blue-50/50 hover:bg-blue-100/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 p-4 rounded-[32px] flex flex-col justify-between flex-shrink-0 border border-blue-100 shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs text-blue-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-400 font-semibold block">Sermons</span>
                    <span className="text-sm font-bold text-blue-950 mt-1 block">Audio &amp; Video</span>
                  </div>
                </div>

                {/* Events */}
                <div
                  onClick={() => navigate("member-events")}
                  className="w-[124px] h-[142px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-[32px] flex flex-col justify-between flex-shrink-0 cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-xl"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-100 font-semibold block">Calendar</span>
                    <span className="text-sm font-bold tracking-tight mt-1 block">
                      {loading ? "…" : `${upcomingEvents.length} Event${upcomingEvents.length !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>

                {/* Prayer */}
                <div
                  onClick={() => setPrayerSubmitted(true)}
                  className="w-[124px] h-[142px] bg-blue-50/50 hover:bg-blue-100/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 p-4 rounded-[32px] flex flex-col justify-between flex-shrink-0 border border-blue-100 shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs text-blue-600">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-400 font-semibold block">Prayer</span>
                    <span className="text-sm font-bold text-blue-950 mt-1 block">
                      {prayerSubmitted ? "Submitted ✓" : "Send Request"}
                    </span>
                  </div>
                </div>

                {/* Groups */}
                <div
                  onClick={() => navigate("member-groups")}
                  className="w-[124px] h-[142px] bg-blue-50/50 hover:bg-blue-100/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 p-4 rounded-[32px] flex flex-col justify-between flex-shrink-0 border border-blue-100 shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-400 font-semibold block">Groups</span>
                    <span className="text-sm font-bold text-blue-950 mt-1 block">Cell Group</span>
                  </div>
                </div>

                {/* Broadcasts */}
                <div
                  onClick={() => navigate("member-broadcasts")}
                  className="w-[124px] h-[142px] bg-blue-50/50 hover:bg-blue-100/60 transition-all duration-300 hover:scale-[1.03] active:scale-95 p-4 rounded-[32px] flex flex-col justify-between flex-shrink-0 border border-blue-100 shadow-xs cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs text-blue-600">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-blue-400 font-semibold block">Broadcasts</span>
                    <span className="text-sm font-bold text-blue-950 mt-1 block">Live &amp; Recorded</span>
                  </div>
                </div>

              </div>
            </div>

            {/* UPCOMING SERVICE CARD */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Service</h2>
                <button
                  onClick={() => navigate("member-events")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  See all
                </button>
              </div>

              {loading ? (
                <div className="h-56 rounded-[36px] bg-slate-100 animate-pulse" />
              ) : nextEvent ? (
                <div
                  onClick={() => setSelectedEvent(nextEvent)}
                  className="relative rounded-[36px] overflow-hidden group cursor-pointer border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-500 h-56 flex flex-col justify-between p-5 hover:scale-[1.01] bg-gradient-to-br from-blue-900 to-indigo-950"
                >
                  {/* Dot pattern */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-900/20 to-transparent pointer-events-none" />

                  {/* Date badge */}
                  <div className="relative z-10 flex items-center gap-2.5">
                    <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 border border-white/25 shadow-sm">
                      <Calendar className="w-3.5 h-3.5 text-blue-200" />
                      <span>
                        {new Date(nextEvent.startDate).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {!nextEvent.isAllDay &&
                          " · " +
                            new Date(nextEvent.startDate).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </span>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">{nextEvent.title}</h3>
                      {nextEvent.location && (
                        <p className="text-xs text-blue-200 font-medium mt-1">{nextEvent.location}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:bg-white group-hover:text-blue-900 group-hover:scale-110 transition-all shadow-md">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 rounded-[36px] bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <p className="text-sm text-blue-400 font-medium">No upcoming services scheduled</p>
                </div>
              )}
            </div>

            {/* RECENT SERMONS */}
            {recentSermons.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Sermons</h2>
                  <button
                    onClick={() => navigate("member-sermons")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    See all
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSermons.map((sermon) => (
                    <button
                      key={sermon.id}
                      onClick={() => { setParam("sermonId", sermon.id); navigate("member-sermon-detail"); }}
                      className="w-full flex items-center gap-3 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 px-4 py-3 text-left transition-all active:scale-[0.99]"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-blue-950 truncate">{sermon.title}</p>
                        <p className="text-[11px] text-blue-400 truncate mt-0.5">{sermon.speaker}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-blue-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* EVENT DETAIL MODAL */}
          {selectedEvent && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col">
              <div className="relative h-64 bg-gradient-to-br from-blue-900 to-indigo-950 flex items-end p-6">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 left-4 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-lg active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative z-10">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{selectedEvent.title}</h2>
                  {selectedEvent.location && (
                    <p className="text-xs text-blue-300 font-bold mt-0.5">{selectedEvent.location}</p>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100 space-y-2">
                  <span className="text-xs text-blue-400 font-medium">Date &amp; Time</span>
                  <div className="text-lg font-bold text-blue-950">
                    {new Date(selectedEvent.startDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  {!selectedEvent.isAllDay && (
                    <div className="text-xs text-blue-600">
                      {new Date(selectedEvent.startDate).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setParam("eventId", selectedEvent.id); navigate("member-events"); setSelectedEvent(null); }}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-transform text-sm tracking-wide flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  View Full Details
                </button>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-2xl active:scale-95 transition-transform text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM FLOATING NAVIGATION BAR */}
          <div className="absolute bottom-5 inset-x-7 z-40">
            <div className="bg-blue-950/95 backdrop-blur-xl text-white p-2 rounded-full shadow-2xl flex items-center justify-between border border-blue-500/20">

              <button
                onClick={() => { setActiveTab("home"); }}
                className={`flex items-center space-x-2 px-5 py-3 rounded-full transition-all duration-300 ${
                  activeTab === "home"
                    ? "bg-white text-blue-950 shadow-lg font-bold scale-105"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
                </svg>
                <span className="text-xs">Home</span>
              </button>

              <button
                onClick={() => { setActiveTab("sermons"); navigate("member-sermons"); }}
                className={`p-3 rounded-full transition-all duration-300 ${
                  activeTab === "sermons"
                    ? "bg-white text-blue-950 shadow-lg scale-105"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setActiveTab("giving"); setGivingModal(true); }}
                className={`p-3 rounded-full transition-all duration-300 ${
                  activeTab === "giving"
                    ? "bg-white text-blue-950 shadow-lg scale-105"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                <Heart className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setActiveTab("profile"); navigate("member-profile"); }}
                className={`p-3 rounded-full transition-all duration-300 ${
                  activeTab === "profile"
                    ? "bg-white text-blue-950 shadow-lg scale-105"
                    : "text-blue-300 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* ── DESKTOP VIEW — unchanged layout ── */}
      <div className="hidden md:block px-8 py-6 max-w-4xl space-y-4">
        <p className="text-sm text-slate-500">
          {getGreeting()}, {firstName}. Use a mobile device or resize your browser to see the member dashboard.
        </p>
      </div>
    </>
  );
}
