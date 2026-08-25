"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  Plus,
  BookOpen,
  ScrollText,
  Clock,
  MapPin,
  Send,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { DashboardStatsDTO } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import {
  CaciAvatar,
  CACISkeleton,
  EmptyState,
  MembershipStatusBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";
import {
  EVENT_CATEGORY_COLORS,
  EVENT_CATEGORY_LABELS,
  type AssemblyEventDTO,
} from "@/lib/types";

export function AdminDashboard() {
  const { user, navigate, setParam, setAdminMobileMenuOpen } = useApp();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<
    { label: string; presentCount: number; absentCount: number; totalMarked: number }[]
  >([]);
  const [upcomingEvents, setUpcomingEvents] = useState<AssemblyEventDTO[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleStatsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const cardWidth = (target.firstElementChild as HTMLElement)?.offsetWidth || 280;
    const index = Math.round(target.scrollLeft / (cardWidth + 16));
    const clamped = Math.max(0, Math.min(2, index));
    if (clamped !== activeCardIndex) {
      setActiveCardIndex(clamped);
    }
  };

  const latestAttendance =
    attendanceTrends.length > 0
      ? attendanceTrends[attendanceTrends.length - 1]
      : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dashRes, trendsRes, eventsRes] = await Promise.all([
          api.dashboard.get(),
          api.attendance.trends(6).catch(() => ({ trends: [] })),
          api.events.list({ upcoming: true, limit: 5 }).catch(() => ({ events: [] })),
        ]);
        if (mounted) {
          setStats(dashRes.stats);
          setAttendanceTrends(trendsRes.trends);
          setUpcomingEvents(eventsRes.events);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const displayName = user?.fullName?.split(" ")[0] || "Admin";

  const goToMember = (id: string) => {
    setParam("memberId", id);
    navigate("admin-member-detail");
  };

  // Sparkline heights from member growth data
  const growthData = stats?.memberGrowth ?? [];
  const growthMax = Math.max(...growthData.map((d) => d.value), 1);
  const growthHeights =
    growthData.length > 0
      ? growthData.map((d) => Math.max((d.value / growthMax) * 100, 6))
      : [40, 65, 35, 80, 50, 95, 70, 85];

  // Attendance sparkline from trends
  const attendMax = Math.max(...attendanceTrends.map((d) => d.totalMarked), 1);
  const attendHeights =
    attendanceTrends.length > 0
      ? attendanceTrends.map((d) => Math.max((d.totalMarked / attendMax) * 100, 6))
      : [55, 35, 75, 45, 90, 60, 80, 65];

  return (
    <>
      <MobileHeader
        title="Dashboard"
        subtitle="Assakae Central Assembly"
        onMenu={() => setAdminMobileMenuOpen(true)}
      />
      <DesktopTopBar
        title="Dashboard"
        subtitle="Assakae Central Assembly"
        action={
          <button
            onClick={() => navigate("admin-sermon-add")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-caci-blue text-white text-[13px] font-semibold hover:bg-caci-blue-dim transition-colors shadow-sm"
          >
            <Send size={14} />
            Add Sermon
          </button>
        }
      />

      {/* ─── Page shell ─────────────────────────────────────────── */}
      <div className="min-h-screen bg-surface-page px-4 py-5 md:px-8 md:py-7 animate-fade-in transition-colors">
        <div className="max-w-6xl mx-auto space-y-7">

          {/* Welcome row */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] md:text-[28px] font-extrabold text-caci-blue dark:text-slate-100 tracking-tight leading-tight">
                Dashboard
              </h1>
              <p className="text-[13px] text-n400 dark:text-slate-400 font-medium mt-0.5">
                Welcome back, {displayName} 👋
              </p>
            </div>
            {/* Quick action pills — desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <QuickPill icon={<Plus size={13} />} label="Add Member" onClick={() => navigate("admin-member-add")} />
              <QuickPill icon={<BookOpen size={13} />} label="Add Sermon" onClick={() => navigate("admin-sermon-add")} />
            </div>
          </div>

          {error && (
            <div className="bg-surface-card rounded-2xl px-4 py-3 border border-red-100 dark:border-red-900/40 text-[13px] text-caci-red dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── 3 Stat Cards (Horizontally scrollable on mobile) ──── */}
          <div className="space-y-2">
            {/* Mobile swipe indicator hint header */}
            <div className="flex md:hidden items-center justify-between px-0.5">
              <span className="text-[11px] font-semibold text-n400 dark:text-slate-400 uppercase tracking-wider">Key Overview</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-caci-blue dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 px-2 py-0.5 rounded-full">
                Swipe <ChevronRight size={12} className="animate-pulse" />
              </span>
            </div>

            <div
              onScroll={handleStatsScroll}
              className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0"
            >
              <div className="w-[82vw] max-w-[320px] md:w-auto shrink-0 md:shrink snap-start">
                <SparkCard
                  loading={loading}
                  label="Total Members"
                  value={stats?.totalMembers ?? 0}
                  sub={stats ? `${stats.activeMembers} active` : undefined}
                  icon={<Users size={15} />}
                  gradient="from-blue-600 to-indigo-400"
                  heights={growthHeights}
                  onClick={() => navigate("admin-members")}
                />
              </div>
              <div className="w-[82vw] max-w-[320px] md:w-auto shrink-0 md:shrink snap-start">
                <GrowthLineCard loading={loading} data={stats?.memberGrowth ?? []} />
              </div>
            </div>

            {/* Mobile pagination indicator dots */}
            <div className="flex md:hidden items-center justify-center gap-1.5 pt-1">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeCardIndex === idx
                      ? "w-6 bg-caci-blue dark:bg-blue-500"
                      : "w-1.5 bg-slate-300 dark:bg-slate-700"
                  )}
                />
              ))}
            </div>
          </div>

          {/* ── Two-column bottom layout ──────────────────────────── */}
          {/* Recent Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-caci-blue dark:text-slate-100 tracking-tight">Recent Members</h2>
              <button
                onClick={() => navigate("admin-members")}
                className="flex items-center gap-1 text-[12px] font-semibold text-n400 dark:text-slate-400 hover:text-caci-blue dark:hover:text-blue-300 transition-colors"
              >
                View all <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-surface-card rounded-3xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80 space-y-1">
              {loading ? (
                [...Array(4)].map((_, i) => <CACISkeleton key={i} className="h-16 rounded-2xl" />)
              ) : stats?.recentMembers && stats.recentMembers.length > 0 ? (
                stats.recentMembers.slice(0, 5).map((m, idx) => (
                  <MemberRow
                    key={m.id}
                    name={m.fullName}
                    sub={`${m.assemblyRole || "Member"} · Joined ${formatRelative(m.joinDate || m.createdAt)}`}
                    photoUrl={m.profilePhotoUrl}
                    status={m.membershipStatus}
                    highlighted={idx === 2}
                    onClick={() => goToMember(m.id)}
                  />
                ))
              ) : (
                <div className="py-8">
                  <EmptyState
                    icon={<Users size={20} />}
                    title="No members yet"
                    description="Newly added members will appear here."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Stat card with gradient micro-bar sparkline */
function SparkCard({
  loading, label, value, sub, icon, gradient, heights, onClick,
}: {
  loading: boolean;
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  heights: number[];
  onClick?: () => void;
}) {
  if (loading) return <CACISkeleton className="h-44 rounded-3xl" />;
  return (
    <button
      onClick={onClick}
      className="bg-surface-card p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-44 w-full text-left hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-n400 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-[20px] font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-n400 dark:text-slate-400 font-medium mt-0.5">{sub}</p>}
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-n400 dark:text-slate-300 group-hover:bg-caci-blue-bg dark:group-hover:bg-blue-900/40 group-hover:text-caci-blue dark:group-hover:text-blue-400 transition-colors">
          {icon}
        </div>
      </div>
      {/* Gradient bar sparkline */}
      <div className="flex items-end justify-between gap-1 h-14">
        {heights.map((h, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-lg bg-gradient-to-t opacity-80 group-hover:opacity-100 transition-opacity", gradient)}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </button>
  );
}

/** Growth trend SVG line card */
function GrowthLineCard({
  loading,
  data,
}: {
  loading: boolean;
  data: { label: string; value: number }[];
}) {
  if (loading) return <CACISkeleton className="h-44 rounded-3xl" />;

  const max = Math.max(...data.map((d) => d.value), 1);
  const peakVal = data.reduce((a, b) => (b.value > a.value ? b : a), { label: "", value: 0 });
  const monthlyGrowth =
    data.length >= 2 ? data[data.length - 1].value - data[data.length - 2].value : 0;
  const pct =
    data.length > 0 && data[data.length - 2]?.value > 0
      ? Math.round((monthlyGrowth / data[data.length - 2].value) * 100)
      : 0;

  const points =
    data.length >= 2
      ? data.map((d, i) => {
          const x = (i / (data.length - 1)) * 200;
          const y = 55 - (d.value / max) * 50;
          return `${x},${y}`;
        })
      : [[0, 45], [50, 40], [80, 15], [130, 35], [180, 22], [200, 30]].map((p) => p.join(","));

  const pathD = `M ${points.join(" L ")}`;
  const peakIdx = data.findIndex((d) => d.value === max);
  const peakX = data.length >= 2 ? (peakIdx / (data.length - 1)) * 200 : 80;
  const peakY = 55 - (max / max) * 50;

  return (
    <div className="bg-surface-card p-5 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between h-44">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-n400 dark:text-slate-400 uppercase tracking-wide">Member Growth</p>
          <p className="text-[20px] font-extrabold text-slate-900 dark:text-white mt-0.5 leading-tight">
            {pct >= 0 ? "+" : ""}{pct}% Monthly
          </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-n400 dark:text-slate-300">
          <TrendingUp size={15} />
        </div>
      </div>

      <div className="relative h-20 w-full flex items-end">
        {peakVal.value > 0 && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-caci-blue dark:text-blue-400 shadow-xs whitespace-nowrap">
            Peak: {peakVal.value}
          </div>
        )}
        <svg className="w-full h-14 overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dashGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-caci-blue)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-caci-blue)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {data.length >= 2 ? (
            <>
              <path d={`${pathD} L 200,60 L 0,60 Z`} fill="url(#dashGlow)" />
              <path d={pathD} fill="none" stroke="var(--color-caci-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {peakVal.value > 0 && (
                <circle cx={peakX} cy={peakY} r="3.5" className="fill-white dark:fill-slate-900 stroke-caci-blue dark:stroke-blue-400 stroke-2" />
              )}
            </>
          ) : (
            <>
              <path d="M 0,45 C 30,40 50,48 80,15 C 110,48 140,25 200,30 L 200,60 L 0,60 Z" fill="url(#dashGlow)" />
              <path d="M 0,45 C 30,40 50,48 80,15 C 110,48 140,25 200,30" fill="none" stroke="var(--color-caci-blue)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="80" cy="15" r="3.5" className="fill-white dark:fill-slate-900 stroke-caci-blue dark:stroke-blue-400 stroke-2" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

/** Member list row */
function MemberRow({
  name, sub, photoUrl, status, highlighted, onClick,
}: {
  name: string;
  sub: string;
  photoUrl?: string | null;
  status: string;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-150 text-left group",
        highlighted
          ? "bg-white dark:bg-slate-800 shadow-[0_6px_20px_rgba(0,75,160,0.07)] dark:shadow-none border border-blue-100/80 dark:border-blue-500/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CaciAvatar name={name} photoUrl={photoUrl} size={40} />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">{name}</p>
          <p className={cn("text-[11px] font-medium truncate", highlighted ? "text-caci-blue dark:text-blue-300" : "text-n400 dark:text-slate-400")}>
            {sub}
          </p>
        </div>
      </div>
      <MembershipStatusBadge status={status} />
    </button>
  );
}

/** Event item styled as a to-do list row */
function EventTodoRow({
  title, day, month, time, location, color, categoryLabel, onClick,
}: {
  title: string;
  day: number;
  month: string;
  time: string;
  location?: string | null;
  color: { bg: string; text: string };
  categoryLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 group cursor-pointer text-left"
    >
      {/* Date badge */}
      <div className={cn("w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0", color.bg)}>
        <span className={cn("text-[14px] font-bold leading-none", color.text)}>{day}</span>
        <span className={cn("text-[9px] font-semibold mt-0.5", color.text)}>{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-caci-blue dark:group-hover:text-blue-400 transition-colors truncate">
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="flex items-center gap-0.5 text-[10px] text-n400 dark:text-slate-400 font-medium">
            <Clock size={9} /> {time}
          </span>
          {location && (
            <span className="flex items-center gap-0.5 text-[10px] text-n400 dark:text-slate-400 font-medium truncate">
              <MapPin size={9} /> {location}
            </span>
          )}
        </div>
      </div>
      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", color.bg, color.text)}>
        {categoryLabel}
      </span>
    </button>
  );
}

/** Desktop quick-action pill */
function QuickPill({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-caci-blue-bg dark:hover:bg-blue-900/40 text-n500 dark:text-slate-300 hover:text-caci-blue dark:hover:text-blue-300 font-medium text-[12px] rounded-2xl transition-all border border-slate-200/80 dark:border-slate-700 shadow-xs"
    >
      {icon}
      {label}
    </button>
  );
}
