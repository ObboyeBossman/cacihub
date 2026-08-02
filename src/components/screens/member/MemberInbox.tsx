"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BookOpen, CheckCheck, Inbox, Radio, Search, AlertCircle, Calendar } from "lucide-react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import type { NotificationDTO } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import {
  CACIButton, CACICard, CACISkeleton, EmptyState, CACIInput,
} from "@/components/caci/ui";
import { MobileHeader, DesktopTopBar } from "@/components/caci/nav";
import { cn } from "@/lib/utils";

type InboxFilter = "all" | "unread" | "sermon" | "broadcast" | "event";

const filterPills: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "sermon", label: "Sermons" },
  { key: "broadcast", label: "Broadcasts" },
  { key: "event", label: "Events" },
];

export function MemberInbox() {
  const { user, setParam, navigate } = useApp();
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");

  const load = useCallback(async () => {
    if (!user?.memberId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await api.notifications.list(user.memberId);
      setNotifications(res.notifications);
    } catch (e: any) {
      setNotifications([]);
      setError(e?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user?.memberId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleMarkAllRead = async () => {
    if (!user?.memberId) return;
    setMarkingAll(true);
    try {
      await api.notifications.markAllRead(user.memberId);
      setNotifications((n) => (n || []).map((x) => ({ ...x, isRead: true })));
    } catch {} finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((n) => (n || []).map((x) => x.id === id ? { ...x, isRead: true } : x));
    } catch {}
  };

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  // Client-side filter — no extra API calls; operates on already-fetched data.
  const filtered = (notifications || []).filter((n) => {
    if (filter === "unread" && n.isRead) return false;
    if (filter === "sermon" && n.type !== "sermon") return false;
    if (filter === "broadcast" && n.type !== "broadcast") return false;
    if (filter === "event" && n.type !== "event") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <MobileHeader
        title="Inbox"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      />
      <DesktopTopBar
        title="Inbox"
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}` : "You're all caught up"}
        action={
          unreadCount > 0 ? (
            <CACIButton size="sm" variant="secondary" leftIcon={<CheckCheck size={15} />} loading={markingAll} onClick={handleMarkAllRead}>
              Mark all read
            </CACIButton>
          ) : undefined
        }
      />
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-md mx-auto md:max-w-3xl">
        {/* Quick stats / banner */}
        {unreadCount > 0 && (
          <div className="md:hidden bg-caci-red-bg border border-caci-red/20 rounded-lg p-3 mb-3 flex items-center gap-2">
            <Bell size={16} className="text-caci-red" />
            <p className="text-[13px] text-caci-red font-medium">{unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}</p>
            <button onClick={handleMarkAllRead} className="ml-auto text-[12px] text-caci-red font-semibold hover:underline">
              Mark all
            </button>
          </div>
        )}

        {/* Search + filter — only show when there are notifications */}
        {!loading && !error && (notifications || []).length > 0 && (
          <div className="space-y-3 mb-4">
            <CACIInput
              placeholder="Search notifications…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} />}
              containerClassName="mb-0"
            />
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {filterPills.map((p) => {
                const active = filter === p.key;
                const count =
                  p.key === "all" ? (notifications || []).length :
                  p.key === "unread" ? unreadCount :
                  p.key === "sermon" ? (notifications || []).filter((n) => n.type === "sermon").length :
                  p.key === "broadcast" ? (notifications || []).filter((n) => n.type === "broadcast").length :
                  (notifications || []).filter((n) => n.type === "event").length;
                return (
                  <button
                    key={p.key}
                    onClick={() => setFilter(p.key)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                      active
                        ? "bg-caci-blue text-white border-caci-blue"
                        : "bg-white text-n500 border-n100 hover:border-caci-blue hover:text-caci-blue",
                    )}
                  >
                    {p.label}
                    {count > 0 && (
                      <span className={cn("ml-1.5 text-[11px]", active ? "text-white/70" : "text-n400")}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <CACICard key={i} className="flex items-start gap-3">
                <CACISkeleton className="size-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <CACISkeleton className="h-4 w-3/4" />
                  <CACISkeleton className="h-3 w-full" />
                  <CACISkeleton className="h-3 w-1/3" />
                </div>
              </CACICard>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <EmptyState
            icon={<AlertCircle size={26} />}
            title="Couldn't load notifications"
            description={error}
            action={<CACIButton onClick={load}>Try again</CACIButton>}
          />
        )}

        {/* Empty: no notifications at all */}
        {!loading && !error && (notifications || []).length === 0 && (
          <EmptyState
            icon={<Inbox size={26} />}
            title="No notifications"
            description="New sermons and assembly announcements will appear here."
          />
        )}

        {/* Empty: notifications exist but filter/search yields nothing */}
        {!loading && !error && (notifications || []).length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={<Search size={26} />}
            title="No matches"
            description={
              searchQuery.trim()
                ? `No notifications match "${searchQuery.trim()}".`
                : "No notifications in this category."
            }
            action={
              <CACIButton variant="secondary" size="sm" onClick={() => { setSearchQuery(""); setFilter("all"); }}>
                Clear filters
              </CACIButton>
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((n, idx) => {
              const isSermon = n.type === "sermon";
              const isBroadcast = n.type === "broadcast";
              const isEvent = n.type === "event";
              const isTappable = !!n.referenceId && (isSermon || isBroadcast) || isEvent;

              function handleTap() {
                if (!n.isRead) handleMarkRead(n.id);
                if (n.type === "sermon" && n.referenceId) {
                  setParam("sermonId", n.referenceId);
                  navigate("member-sermon-detail");
                } else if (n.type === "broadcast" && n.referenceId) {
                  setParam("broadcastId", n.referenceId);
                  navigate("member-broadcast-detail");
                } else if (n.type === "event") {
                  navigate("member-events");
                }
              }

              return (
                <CACICard
                  key={n.id}
                  hover={isTappable}
                  onClick={isTappable ? handleTap : undefined}
                  className={cn(
                    "flex items-start gap-3 animate-stagger",
                    !n.isRead && "border-l-4 border-l-caci-red",
                  )}
                  style={{ ["--stagger-i" as string]: Math.min(idx, 8) }}
                >
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center shrink-0",
                    n.isRead ? "bg-n50 text-n400" : "bg-caci-red-bg text-caci-red",
                  )}>
                    {isSermon ? <BookOpen size={18} /> : isBroadcast ? <Radio size={18} /> : isEvent ? <Calendar size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-[15px] leading-snug", n.isRead ? "font-medium text-n700" : "font-semibold text-n900")}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="size-2 rounded-full bg-caci-red shrink-0 mt-1.5 animate-badge-pulse" />}
                    </div>
                    <p className="text-[13px] text-n500 mt-1 line-clamp-2">{n.body}</p>
                    <p className="text-[12px] text-n400 mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                </CACICard>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
