"use client";

import { useRef, useState } from "react";
import {
  Bell,
  Heart,
  Calendar,
  BookOpen,
  Users,
  ChevronRight,
  Sparkles,
  Settings,
  ArrowUpRight,
  BellRing,
  Navigation,
  Compass,
  MessageSquare,
} from "lucide-react";
import { useApp } from "@/lib/store";

export function MemberDashboard() {
  const { user, navigate } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [configModal, setConfigModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const items = [
    { id: "library", title: "Sermons", icon: BookOpen, sub: "Library", image: "/images/member-dashboard/updates-1.webp" },
    { id: "events", title: "Events", icon: Calendar, sub: "Schedule", image: "/images/member-dashboard/updates-2.webp" },
    { id: "prayer", title: "Prayer", icon: Heart, sub: "Requests", image: "/images/member-dashboard/updates-3.png" },
    { id: "groups", title: "Join", icon: Users, sub: "Groups", image: "/images/member-dashboard/updates-4.png" },
  ];

  const renderUpdateCard = (item: (typeof items)[number], idx: number) => {
    const isLandscape = idx % 2 === 0;

    return (
      <div
        key={item.id}
        onClick={() => showToast(`Opening ${item.title}...`)}
        className={`min-w-[160px] w-[160px] snap-start flex-shrink-0 cursor-pointer hover:scale-[1.05] transition-transform duration-300 ${isLandscape ? "" : ""}`}
      >
        {isLandscape ? (
          <div className="w-full h-[240px] bg-white p-[5px] rounded-[15px] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)] border border-slate-100/80 flex flex-col">
            <div className="relative w-full h-[156px] overflow-hidden rounded-[7px] group">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div className="flex items-center justify-between pt-3 pb-1 px-2 flex-1">
              <div className="flex flex-col">
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">{item.title}</h3>
                <span className="text-[12px] text-slate-400 font-medium mt-0.5">{item.sub}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
                <item.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[240px] bg-white p-[5px] rounded-[15px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-slate-100/80 overflow-hidden">
            <div className="relative w-full h-full rounded-[7px] overflow-hidden group">
              <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute top-3 right-3 p-2.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-md text-white shadow-sm">
                <item.icon className="w-4 h-4" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                <h3 className="text-[20px] font-extrabold tracking-tight mb-0.5">{item.title}</h3>
                <p className="text-[13px] text-gray-300 font-medium">{item.sub}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const fullName = user?.fullName || "Friend";
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Friend";
  const title = user?.fullName?.includes(" ") ? nameParts[0] : "";
  const greetingName = `${firstName}`;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = 160 + 16;
      const index = Math.round(scrollLeft / itemWidth);
      setActiveIndex(index);
    }
  };

  const handleSaveSettings = () => {
    setConfigModal(false);
    showToast(notificationsEnabled ? "Notifications enabled successfully!" : "Configuration updated.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-10 select-none flex justify-center relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-caci-blue text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-2xl space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
              alt="Profile"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-sm text-n500 font-medium flex items-center gap-1.5">
                Welcome back, {greetingName} 👋
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-n900 leading-tight">
                Good Morning
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate("member-inbox")}
            className="relative w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
          >
            <Bell className="w-5 h-5 text-n700" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        <div
          onClick={() => setConfigModal(true)}
          className="bg-caci-blue text-white rounded-full p-2 pr-6 flex items-center justify-between cursor-pointer hover:bg-caci-blue-dim transition-colors shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-caci-blue flex items-center justify-center shadow-inner">
              <Settings className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-wide">System Configuration</span>
              <span className="text-[11px] sm:text-xs text-caci-blue-bg font-medium">
                {notificationsEnabled ? "Notifications Enabled • Click to manage" : "Enable notifications & manage preferences"}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-caci-blue-bg" />
        </div>

        <div className="space-y-4">
<h2 className="text-lg font-bold text-n900 tracking-tight px-1">Updates</h2>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex space-x-4 overflow-x-auto py-2 px-2 snap-x scrollbar-hide"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {items.map((item, idx) => renderUpdateCard(item, idx))}
          </div>

          <div className="flex justify-center gap-2">
            {items.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? "w-6 bg-caci-blue" : "w-2 bg-n200"}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-n900 tracking-tight">What&apos;s On</h2>
            <button onClick={() => showToast("Viewing all events...")} className="text-xs font-semibold text-n500 hover:text-n900">
              See all
            </button>
          </div>

          <div
            onClick={() => showToast("Opening Main Sanctuary details...")}
            className="w-full max-w-[420px] h-[300px] bg-white p-[5px] rounded-[15px] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_25px_55px_-10px_rgba(0,0,0,0.18)] mx-auto border border-slate-100/80 cursor-pointer"
          >
            <div className="relative w-full h-[200px] overflow-hidden rounded-[7px] group">
              <img
                src="/images/member-dashboard/whats-on-harvest.png"
                alt="Harvest"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="flex items-center justify-between pt-3 pb-1 px-2 flex-1 gap-3">
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">Harvest Celebration</h3>
                <span className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">Communion Service • Pastor Vance • Worship & Fellowship</span>
              </div>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  showToast("Opening details for Main Sanctuary...");
                }}
                className="flex items-center justify-center bg-[#0084FF] hover:bg-[#0076E6] active:scale-95 transition-all text-white px-3 py-2 rounded-full shadow-[0_4px_14px_rgba(0,132,255,0.35)] font-semibold text-[12px] cursor-pointer whitespace-nowrap"
                aria-label="View details for Main Sanctuary"
              >
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Community Highlights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <Compass className="w-5 h-5 text-n700" />
            <h2 className="text-lg font-bold text-n900 tracking-tight">Community Highlights</h2>
          </div>

          <div className="bg-white rounded-[20px] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.10)] border border-slate-100/80 p-4 space-y-3">
            {/* Highlight Card 1 */}
            <div className="bg-slate-50 rounded-[14px] border border-slate-100 p-4">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Youth Ministry</span>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight mt-1 leading-snug">Friday Night Fire Revival</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">
                Join fellow young believers for worship and fellowship at 6:30 PM.
              </p>
            </div>

            {/* Highlight Card 2 */}
            <div className="bg-slate-50 rounded-[14px] border border-slate-100 p-4">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Outreach</span>
              <h3 className="text-[16px] font-bold text-slate-900 tracking-tight mt-1 leading-snug">Community Food Bank Drive</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">
                Volunteers needed this Saturday morning at the main fellowship hall.
              </p>
            </div>
          </div>
        </div>

        {/* Pastoral Care CTA */}
        <div className="bg-[#111] rounded-[20px] p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[14px] bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white leading-tight">Need Pastoral Care?</h3>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">Connect directly with our care ministers.</p>
            </div>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              disabled
              aria-disabled="true"
              className="w-full py-4 rounded-[14px] bg-white text-[#111] font-bold text-[15px] tracking-tight
                         opacity-40 cursor-not-allowed select-none"
            >
              Request Counseling
            </button>
          </div>
        </div>
      </div>

      {configModal && (
        <div className="fixed inset-0 z-50 bg-caci-blue/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card text-foreground w-full max-w-sm rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-n700" />
                System Configuration
              </h3>
              <button
                onClick={() => setConfigModal(false)}
                className="text-xs font-semibold text-n500 bg-muted px-3 py-1.5 rounded-full"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted cursor-pointer hover:bg-n100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <BellRing className="w-5 h-5 text-n700" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-n900">Enable Notifications</span>
                    <span className="text-[11px] text-n500">Receive alerts & updates</span>
                  </div>
                </div>
                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${notificationsEnabled ? "bg-caci-blue" : "bg-n200"}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </div>

              <div
                onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted cursor-pointer hover:bg-n100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 text-n700" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-n900">Email Digest</span>
                    <span className="text-[11px] text-n500">Weekly service summary</span>
                  </div>
                </div>
                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${emailAlertsEnabled ? "bg-caci-blue" : "bg-n200"}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${emailAlertsEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-3.5 bg-caci-blue text-white font-bold rounded-2xl text-sm hover:bg-caci-blue-dim transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
