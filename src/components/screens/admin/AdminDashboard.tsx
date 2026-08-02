"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UsersRound,
  Radio,
  Plus,
  Send,
  BookOpen,
  ScrollText,
  ArrowRight,
  TrendingUp,
  CalendarCheck,
  Search,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { DashboardStatsDTO } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import {
  CACIButton,
  CACICard,
  CaciAvatar,
  CACISkeleton,
  EmptyState,
  SectionHeading,
  StatTile,
  MembershipStatusBadge,
  TargetingBadge,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";
import { EVENT_CATEGORY_COLORS, EVENT_CATEGORY_LABELS, type AssemblyEventDTO } from "@/lib/types";

export function AdminDashboard() {
  const { user, navigate, setParam, setSearchOpen } = useApp();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<
    { label: string; presentCount: number; absentCount: number; totalMarked: number }[]
  >([]);
  const [upcomingEvents, setUpcomingEvents] = useState<AssemblyEventDTO[]>([]);

  // Latest week's attendance (last entry in trends) for the stat tile.
  const latestAttendance = attendanceTrends.length > 0
    ? attendanceTrends[attendanceTrends.length - 1]
    : null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dashRes, trendsRes, eventsRes] = await Promise.all([
          api.dashboard.get(),
          api.attendance.trends(6).catch(() => ({ trends: [] })),
          api.events.list({ upcoming: true, limit: 4 }).catch(() => ({ events: [] })),
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
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = user?.fullName || "Admin";

  const goToMember = (id: string) => {
    setParam("memberId", id);
    navigate("admin-member-detail");
  };

  return (
    <>
      <MobileHeader title="Dashboard" subtitle="Assakae Central Assembly" />
      <DesktopTopBar
        title="Dashboard"
        subtitle="Assakae Central Assembly"
        action={
          <CACIButton
            size="sm"
            leftIcon={<Send size={15} />}
            onClick={() => navigate("admin-broadcast-compose")}
          >
            Send Broadcast
          </CACIButton>
        }
      />

      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-6xl animate-fade-in">
        {/* Welcome banner */}
        <CACICard padding="lg" className="mb-4 bg-gradient-to-br from-caci-blue to-caci-blue-dim text-white border-0">
          <p className="text-[14px] text-white/80">Welcome back,</p>
          <h2 className="text-[20px] font-bold leading-tight">{displayName} 🙏</h2>
          <div className="mt-3 pt-3 border-t border-white/15">
            <p className="text-[13px] italic text-white/90">
              &ldquo;The Lord bless thee, and keep thee.&rdquo;
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">— Numbers 6:24</p>
          </div>
        </CACICard>

        {/* Mobile search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="md:hidden flex items-center gap-2 w-full h-11 px-3 mb-4 rounded-lg border border-n100 bg-white text-n400 text-[14px] hover:border-caci-blue hover:text-caci-blue transition-colors"
        >
          <Search size={17} />
          <span className="flex-1 text-left">Search members, sermons, events…</span>
        </button>

        {error && (
          <CACICard className="mb-4 border-caci-red/30 bg-caci-red-bg">
            <p className="text-[14px] text-caci-red">{error}</p>
          </CACICard>
        )}

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[...Array(4)].map((_, i) => (
              <CACISkeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <StatTile
              label="Total Members"
              value={stats?.totalMembers ?? 0}
              icon={<Users size={20} />}
              accent="red"
              onClick={() => navigate("admin-members")}
            />
            <StatTile
              label="Active Members"
              value={stats?.activeMembers ?? 0}
              icon={<UserCheck size={20} />}
              accent="green"
              trend={
                stats && stats.totalMembers > 0
                  ? { value: `${Math.round((stats.activeMembers / stats.totalMembers) * 100)}% of total`, positive: true }
                  : undefined
              }
            />
            <StatTile
              label="Total Groups"
              value={stats?.totalGroups ?? 0}
              icon={<UsersRound size={20} />}
              accent="blue"
              onClick={() => navigate("admin-groups")}
            />
            <StatTile
              label="Broadcasts (7d)"
              value={stats?.broadcastsThisWeek ?? 0}
              icon={<Radio size={20} />}
              accent="amber"
              onClick={() => navigate("admin-broadcasts")}
            />
            <StatTile
              label="Last Service"
              value={latestAttendance ? latestAttendance.presentCount : "—"}
              icon={<CalendarCheck size={20} />}
              accent="green"
              trend={
                latestAttendance && latestAttendance.totalMarked > 0
                  ? { value: `of ${latestAttendance.totalMarked} marked`, positive: true }
                  : undefined
              }
              onClick={() => navigate("admin-attendance")}
            />
          </div>
        )}

        {/* Member status breakdown */}
        {!loading && stats && (
          <CACICard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold text-n700">Member Status</p>
              <span className="text-[12px] text-n400">{stats.totalMembers} total</span>
            </div>
            {/* Horizontal bar */}
            {stats.totalMembers > 0 ? (
              <>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-n50 mb-3">
                  <div
                    className="bg-[#1a7f37]"
                    style={{ width: `${(stats.activeMembers / stats.totalMembers) * 100}%` }}
                    title="Active"
                  />
                  <div
                    className="bg-[#9a6700]"
                    style={{ width: `${(stats.visitorCount / stats.totalMembers) * 100}%` }}
                    title="Visitors"
                  />
                  <div
                    className="bg-n300"
                    style={{ width: `${(stats.inactiveCount / stats.totalMembers) * 100}%` }}
                    title="Inactive"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <StatusMini label="Active" count={stats.activeMembers} color="#1a7f37" />
                  <StatusMini label="Visitors" count={stats.visitorCount} color="#9a6700" />
                  <StatusMini label="Inactive" count={stats.inactiveCount} color="#6e7681" />
                </div>
              </>
            ) : (
              <p className="text-[13px] text-n400">No members yet.</p>
            )}
          </CACICard>
        )}

        {/* Member growth chart */}
        {!loading && stats && stats.memberGrowth && stats.memberGrowth.length > 0 && (
          <CACICard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold text-n700">Member Growth (6 months)</p>
              <TrendingUp size={16} className="text-[#1a7f37]" />
            </div>
            <GrowthChart data={stats.memberGrowth} />
          </CACICard>
        )}

        {/* Attendance trends chart */}
        {!loading && attendanceTrends.length > 0 && (
          <CACICard className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[14px] font-semibold text-n700">Attendance Trends</p>
                <p className="text-[12px] text-n400">Weekly present vs absent (6 weeks)</p>
              </div>
              <CalendarCheck size={16} className="text-caci-blue" />
            </div>
            <AttendanceTrendsChart data={attendanceTrends} />
          </CACICard>
        )}

        {/* Quick actions — desktop only; mobile uses the floating CTA (+) button */}
        <div className="hidden md:block mb-4">
          <SectionHeading title="Quick Actions" className="mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <QuickAction
              label="Add Member"
              icon={<Plus size={18} />}
              accent="red"
              onClick={() => navigate("admin-member-add")}
            />
            <QuickAction
              label="Send Broadcast"
              icon={<Send size={18} />}
              accent="blue"
              onClick={() => navigate("admin-broadcast-compose")}
            />
            <QuickAction
              label="Add Sermon"
              icon={<BookOpen size={18} />}
              accent="green"
              onClick={() => navigate("admin-sermon-add")}
            />
            <QuickAction
              label="Attendance"
              icon={<CalendarCheck size={18} />}
              accent="amber"
              onClick={() => navigate("admin-attendance")}
            />
            <QuickAction
              label="Audit Log"
              icon={<ScrollText size={18} />}
              accent="blue"
              onClick={() => navigate("admin-audit")}
            />
          </div>
        </div>

        {/* Recent members */}
        <div className="mb-4">
          <SectionHeading
            title="Recent Members"
            action={
              <button
                onClick={() => navigate("admin-members")}
                className="text-[13px] font-medium text-caci-blue hover:underline flex items-center gap-0.5"
              >
                View all <ArrowRight size={13} />
              </button>
            }
            className="mb-3"
          />
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <CACISkeleton key={i} className="h-16" />
              ))}
            </div>
          ) : stats && stats.recentMembers && stats.recentMembers.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMembers.slice(0, 5).map((m) => (
                <CACICard
                  key={m.id}
                  hover
                  padding="sm"
                  className="flex items-center gap-3"
                  onClick={() => goToMember(m.id)}
                >
                  <CaciAvatar name={m.fullName} photoUrl={m.profilePhotoUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-n900 truncate">{m.fullName}</p>
                    <p className="text-[12px] text-n400 truncate">
                      {m.assemblyRole || "Member"} · Joined {formatRelative(m.joinDate || m.createdAt)}
                    </p>
                  </div>
                  <MembershipStatusBadge status={m.membershipStatus} />
                </CACICard>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users size={20} />}
              title="No members yet"
              description="Newly added members will appear here."
            />
          )}
        </div>

        {/* Recent broadcasts */}
        <div>
          <SectionHeading
            title="Recent Broadcasts"
            action={
              <button
                onClick={() => navigate("admin-broadcasts")}
                className="text-[13px] font-medium text-caci-blue hover:underline flex items-center gap-0.5"
              >
                View all <ArrowRight size={13} />
              </button>
            }
            className="mb-3"
          />
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <CACISkeleton key={i} className="h-20" />
              ))}
            </div>
          ) : stats && stats.recentBroadcasts && stats.recentBroadcasts.length > 0 ? (
            <div className="space-y-2">
              {stats.recentBroadcasts.slice(0, 5).map((b) => (
                <CACICard
                  key={b.id}
                  padding="default"
                  hover
                  onClick={() => {
                    setParam("broadcastId", b.id);
                    navigate("admin-broadcast-detail");
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[14px] font-semibold text-n900 line-clamp-1 flex-1">{b.title}</p>
                    <TargetingBadge mode={b.targetingMode} />
                  </div>
                  <p className="text-[13px] text-n500 line-clamp-2 mb-1.5">{b.body}</p>
                  <p className="text-[11px] text-n400">
                    {b.sentByName || "Admin"} · {formatRelative(b.sentAt)}
                    {b.targetGroupName ? ` · ${b.targetGroupName}` : ""}
                  </p>
                </CACICard>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Radio size={20} />}
              title="No broadcasts yet"
              description="Send your first broadcast to reach the assembly."
            />
          )}
        </div>

        {/* Upcoming events */}
        {!loading && (
          <div className="mb-4">
            <SectionHeading
              title="Upcoming Events"
              className="mb-3"
              action={
                <button
                  onClick={() => navigate("admin-events")}
                  className="text-[13px] font-medium text-caci-blue hover:underline flex items-center gap-0.5"
                >
                  View all <ArrowRight size={13} />
                </button>
              }
            />
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => {
                  const colors = EVENT_CATEGORY_COLORS[event.category] || EVENT_CATEGORY_COLORS.other;
                  const d = new Date(event.startDate);
                  return (
                    <CACICard
                      key={event.id}
                      padding="default"
                      hover
                      onClick={() => navigate("admin-events")}
                      className="flex items-center gap-3"
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
                          <span>
                            {event.isAllDay
                              ? "All day"
                              : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {event.location && <span className="truncate">· {event.location}</span>}
                        </div>
                      </div>
                    </CACICard>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarCheck size={20} />}
                title="No upcoming events"
                description="Schedule events to keep the assembly informed."
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

function StatusMini({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-md bg-n50 px-2 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[11px] text-n400">{label}</span>
      </div>
      <p className="text-[16px] font-bold text-n900 mt-0.5">{count}</p>
    </div>
  );
}

function GrowthChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
              <div
                className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-caci-blue to-caci-blue-light transition-all"
                style={{ height: `${h}%` }}
                title={`${d.value} new member(s)`}
              />
            </div>
            <span className="text-[10px] text-n400">{d.label}</span>
            <span className="text-[11px] font-semibold text-n700">{d.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function AttendanceTrendsChart({
  data,
}: {
  data: { label: string; presentCount: number; absentCount: number; totalMarked: number }[];
}) {
  const max = Math.max(...data.map((d) => d.totalMarked), 1);
  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-n500">
          <span className="size-2.5 rounded-sm bg-[#1a7f37]" /> Present
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-n500">
          <span className="size-2.5 rounded-sm bg-caci-red" /> Absent
        </span>
      </div>
      {/* Stacked bars */}
      <div className="flex items-end justify-between gap-2 h-36">
        {data.map((d, i) => {
          const totalH = Math.max((d.totalMarked / max) * 100, d.totalMarked > 0 ? 4 : 0);
          const presentRatio = d.totalMarked > 0 ? d.presentCount / d.totalMarked : 0;
          const presentH = (totalH * presentRatio).toFixed(2);
          const absentH = (totalH * (1 - presentRatio)).toFixed(2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center" style={{ height: "110px" }}>
                <div
                  className="w-full max-w-[32px] rounded-t-md overflow-hidden flex flex-col-reverse transition-all"
                  style={{ height: `${totalH}%` }}
                  title={`${d.presentCount} present, ${d.absentCount} absent`}
                >
                  <div className="bg-[#1a7f37]" style={{ height: `${presentH}%` }} />
                  <div className="bg-caci-red" style={{ height: `${absentH}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-n400">{d.label}</span>
              <span className="text-[11px] font-semibold text-n700">
                {d.presentCount}/{d.totalMarked}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  accent,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  accent: "red" | "blue" | "green" | "amber";
  onClick: () => void;
}) {
  const accentClasses = {
    red: "bg-caci-red-bg text-caci-red",
    blue: "bg-caci-blue-bg text-caci-blue",
    green: "bg-[#dafbe1] text-[#1a7f37]",
    amber: "bg-[#fff8c5] text-[#9a6700]",
  }[accent];
  return (
    <CACICard hover padding="default" onClick={onClick} className="flex flex-col items-center justify-center gap-2 text-center">
      <div className={cn("flex size-10 items-center justify-center rounded-lg", accentClasses)}>
        {icon}
      </div>
      <span className="text-[13px] font-semibold text-n700">{label}</span>
    </CACICard>
  );
}
