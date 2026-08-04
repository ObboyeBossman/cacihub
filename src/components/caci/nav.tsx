"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useApp, type Screen } from "@/lib/store";
import { useFabSettings } from "@/lib/fab-settings";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Radio,
  BookOpen,
  Shield,
  Settings,
  ScrollText,
  Inbox,
  MessageSquare,
  User,
  Bell,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Plus,
  UserPlus,
  Send,
  X,
  CalendarCheck,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { CaciLogo } from "./ui";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// ============================================================
// CACI Bottom Navigation (mobile-only) — floating pill dock
// 4 nav tabs + draggable CTA (+) button with Quick Actions popup
// ============================================================

interface NavItem {
  screen: Screen;
  label: string;
  Icon: React.FC<{ active: boolean }>;
}

/* ── Inline SVG icons sized/coloured by active state ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}
function MembersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21" />
      <circle cx="12" cy="7.5" r="4" />
    </svg>
  );
}
function GroupsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 19.5V21" />
      <circle cx="8.5" cy="8" r="3.5" />
      <path d="M19.5 21v-1a3 3 0 0 0-2.2-2.9" />
      <path d="M14.5 5.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}
function BroadcastIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" fill={active ? "#004ba0" : "#484f58"} />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
    </svg>
  );
}
function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function ChatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function SermonsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
function MoreDotsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1.2" fill={active ? "#004ba0" : "#484f58"} />
      <circle cx="19" cy="12" r="1.2" fill={active ? "#004ba0" : "#484f58"} />
      <circle cx="5"  cy="12" r="1.2" fill={active ? "#004ba0" : "#484f58"} />
    </svg>
  );
}

const adminNav: NavItem[] = [
  { screen: "admin-dashboard",  label: "Home",       Icon: HomeIcon },
  { screen: "admin-members",    label: "Members",    Icon: MembersIcon },
  { screen: "admin-groups",     label: "Groups",     Icon: GroupsIcon },
  { screen: "admin-broadcasts", label: "Broadca...", Icon: BroadcastIcon },
];

const memberNav: NavItem[] = [
  { screen: "member-dashboard",   label: "Home",    Icon: HomeIcon },
  { screen: "member-inbox",       label: "Inbox",   Icon: InboxIcon },
  { screen: "member-groups",      label: "Chats",   Icon: ChatsIcon },
  { screen: "member-sermons",     label: "Sermons", Icon: SermonsIcon },
];

/* ── Quick-action menu items per role ── */
interface QuickAction {
  label: string;
  screen: Screen;
  Icon: React.FC;
}

function QAAddMemberIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 19.5V21" />
      <circle cx="9.5" cy="8" r="3.5" />
      <line x1="18" y1="7" x2="18" y2="13" />
      <line x1="15" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function QABroadcastIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
    </svg>
  );
}
function QAAddGroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 20v-1.2a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3V20" />
      <circle cx="7.5" cy="8.5" r="3" />
      <line x1="18" y1="6" x2="18" y2="12" />
      <line x1="15" y1="9" x2="21" y2="9" />
    </svg>
  );
}
function QAAddSermonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h7A2.5 2.5 0 0 1 14 4.5V20a2 2 0 0 0-2-2h-7.5A2.5 2.5 0 0 1 2 15.5v-11z" />
      <path d="M22 4.5A2.5 2.5 0 0 0 19.5 2h-7A2.5 2.5 0 0 0 10 4.5V20a2 2 0 0 1 2-2h7.5A2.5 2.5 0 0 0 22 15.5v-11z" />
    </svg>
  );
}
function QAAccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="10.5" width="17" height="10.5" rx="3" />
      <path d="M7 10.5V7a5 5 0 0 1 10 0v3.5" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
      <line x1="12" y1="16.2" x2="12" y2="18.2" strokeWidth="2" />
    </svg>
  );
}

const adminQuickActions: QuickAction[] = [
  { label: "Add Member",     screen: "admin-member-add",         Icon: QAAddMemberIcon },
  { label: "Broadcast",      screen: "admin-broadcast-compose",  Icon: QABroadcastIcon },
  { label: "Add Group",      screen: "admin-group-add",          Icon: QAAddGroupIcon },
  { label: "Add Sermon",     screen: "admin-sermon-add",         Icon: QAAddSermonIcon },
  { label: "Accounts",       screen: "admin-accounts",           Icon: QAAccountIcon },
];

const memberQuickActions: QuickAction[] = [
  { label: "My Profile",  screen: "member-profile",  Icon: QAAddMemberIcon },
  { label: "Settings",    screen: "member-settings", Icon: QAAccountIcon },
];

// ============================================================
// Member FAB Navigation — floating FAB + categorised menu card + radial arc
// Replaces the bottom pill dock for member role.
// ============================================================

interface FabMenuItem {
  screen: Screen;
  label: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
}

interface FabRadialAction {
  screen: Screen;
  label: string;
  Icon: React.ComponentType<{ className?: string; size?: number }>;
}

const memberFabCategories: { category: string; items: FabMenuItem[] }[] = [
  {
    category: "Personal",
    items: [
      { screen: "member-dashboard", label: "Home",       Icon: LayoutDashboard, color: "bg-blue-600" },
      { screen: "member-inbox",     label: "Inbox",      Icon: Bell,           color: "bg-sky-600" },
      { screen: "member-profile",   label: "My Profile",  Icon: User,           color: "bg-indigo-600" },
      { screen: "member-settings",  label: "Settings",    Icon: Settings,       color: "bg-slate-700" },
    ],
  },
  {
    category: "Assembly",
    items: [
      { screen: "member-groups",     label: "Chats",       Icon: MessageSquare, color: "bg-purple-600" },
      { screen: "member-broadcasts",  label: "Broadcasts",  Icon: Radio,         color: "bg-amber-600" },
      { screen: "member-sermons",     label: "Sermons",     Icon: BookOpen,       color: "bg-rose-600" },
      { screen: "member-events",      label: "Events",      Icon: Calendar,       color: "bg-emerald-600" },
      { screen: "member-directory",   label: "Directory",   Icon: Users,          color: "bg-teal-600" },
    ],
  },
];

const memberRadialActions: FabRadialAction[] = [
  { screen: "member-profile",  label: "My Profile", Icon: User },
  { screen: "member-settings", label: "Settings",   Icon: Settings },
];

export function MemberFABNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { screen, navigate, resetTo } = useApp();
  const { fab } = useFabSettings();

  /* ── Popup & radial state ── */
  const [menuOpen, setMenuOpen]     = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  /* ── FAB side + drag state ── */
  const [fabSide, setFabSide]       = useState<"right" | "left">("right");
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragStartRef = useRef<{ x: number; initialSide: "right" | "left" }>({ x: 0, initialSide: "right" });

  /* ── Long-press refs ── */
  const holdTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const didLongPress = useRef(false);

  const fabActive = menuOpen || radialOpen;

  /* ── Active-state helper (preserves existing member active logic) ── */
  const isItemActive = (itemScreen: Screen) => {
    if (screen === itemScreen) return true;
    if (itemScreen === "member-groups"     && (screen === "member-group-chat" || screen === "member-forum")) return true;
    if (itemScreen === "member-broadcasts"  && screen === "member-broadcast-detail") return true;
    if (itemScreen === "member-sermons"     && (screen === "member-sermon-detail" || screen === "member-sermon-series")) return true;
    if (itemScreen === "member-profile"     && screen === "member-profile-edit") return true;
    if (itemScreen === "member-settings"   && screen === "member-profile-edit") return true;
    return false;
  };

  /* ── Navigation helper (preserves existing routing logic) ── */
  const handleNavigate = (targetScreen: Screen) => {
    setMenuOpen(false);
    setRadialOpen(false);
    if (targetScreen === "member-dashboard" || targetScreen === "member-inbox") {
      resetTo(targetScreen);
    } else {
      navigate(targetScreen);
    }
  };

  /* ── Close on Escape key ── */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setRadialOpen(false);
      }
    };
    if (menuOpen || radialOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [menuOpen, radialOpen]);

  /* ── Long-press handlers (configurable duration) ── */
  const startPress = () => {
    didLongPress.current = false;
    setHoldProgress(0);
    const t0 = Date.now();
    const dur = fab.holdDuration;
    progressRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - t0) / dur) * 100);
      setHoldProgress(pct);
    }, 16);
    holdTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (progressRef.current) clearInterval(progressRef.current);
      setHoldProgress(0);
      setMenuOpen(false);
      setRadialOpen((v) => !v);
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, dur);
  };

  const cancelPress = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setHoldProgress(0);
  };

  /* ── FAB click (short press) ── */
  const handleFabClick = () => {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    if (radialOpen || menuOpen) {
      setRadialOpen(false);
      setMenuOpen(false);
    } else {
      setRadialOpen(false);
      setMenuOpen(true);
    }
  };

  /* ── Pointer drag handlers (same 60px threshold as existing CTA) ── */
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, initialSide: fabSide };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartRef.current.x;
    setDragOffsetX(Math.max(-240, Math.min(240, delta)));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = fab.dragThreshold;
    if (dragStartRef.current.initialSide === "right" && dragOffsetX < -threshold) {
      setFabSide("left");
      setMenuOpen(false);
      setRadialOpen(false);
    } else if (dragStartRef.current.initialSide === "left" && dragOffsetX > threshold) {
      setFabSide("right");
      setMenuOpen(false);
      setRadialOpen(false);
    }
    setDragOffsetX(0);
  };

  /* ── Radial geometry from settings ── */
  const RADIAL_RADIUS   = fab.radialRadius;
  const RADIAL_START    = fab.radialStartAngle;
  const RADIAL_END      = fab.radialEndAngle;

  /* ── Close both menu and radial ── */
  const closeAll = () => {
    setMenuOpen(false);
    setRadialOpen(false);
  };

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          Backdrop — shown when menu card OR radial is open
          ════════════════════════════════════════════════════════ */}
      <div
        onClick={closeAll}
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          fabActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ backgroundColor: `rgba(15, 23, 42, ${fab.backdropOpacity})` }}
      />

      {/* ════════════════════════════════════════════════════════
          Categorised Menu Card
          ════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-50 bg-white rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden md:hidden"
        style={{
          bottom: "96px",
          width: `${fab.cardWidth}px`,
          maxHeight: `${fab.cardMaxHeight}px`,
          ...(fabSide === "right"
            ? { right: "2rem", left: "auto", transformOrigin: "bottom right" }
            : { left: "2rem", right: "auto", transformOrigin: "bottom left" }),
          transform: menuOpen ? "scale(1)" : "scale(0.3)",
          opacity: menuOpen ? 1 : 0,
          transition: "transform 380ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 220ms ease",
          pointerEvents: menuOpen ? "auto" : "none",
          padding: "16px",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CaciLogo size={16} /> Member Menu
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body with categorised sections */}
        <div className="overflow-y-auto pr-1 pt-3 space-y-4 flex-1 scrollbar-thin">
          {memberFabCategories.map((catGroup) => (
            <div key={catGroup.category} className="space-y-2">
              <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider px-1">
                {catGroup.category}
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {catGroup.items.map((item) => {
                  const active = isItemActive(item.screen);
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.screen}
                      onClick={() => handleNavigate(item.screen)}
                      className={cn(
                        "relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-200 group",
                        active
                          ? "bg-blue-50 border border-blue-200 shadow-xs"
                          : "bg-slate-50/80 hover:bg-slate-100 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 text-white shadow-xs",
                        item.color
                      )}>
                        <Icon size={fab.iconSize} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">
                        {item.label}
                      </span>
                      {/* Unread badge on Inbox */}
                      {item.screen === "member-inbox" && unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-caci-red text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          Radial Shortcut Arc
          ════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-50 pointer-events-none md:hidden"
        style={{
          bottom: "calc(2rem + 28px)",
          ...(fabSide === "right"
            ? { right: "calc(2rem + 28px)" }
            : { left: "calc(2rem + 28px)" }),
        }}
      >
        {memberRadialActions.map((action, i) => {
          const step = (RADIAL_END - RADIAL_START) / Math.max(1, memberRadialActions.length - 1);
          const angleDeg = RADIAL_START + step * i;
          const angle = angleDeg * (Math.PI / 180);
          // FAB on right → buttons fan left/up (positive cos gives negative x for 100-170°)
          // FAB on left  → buttons fan right/up (negate x)
          const dirMul = fabSide === "right" ? 1 : -1;
          const x = radialOpen ? dirMul * RADIAL_RADIUS * Math.cos(angle) : 0;
          const y = radialOpen ? -RADIAL_RADIUS * Math.sin(angle) : 0;
          const delay = radialOpen ? i * 40 : 0;
          const ActionIcon = action.Icon;
          return (
            <button
              key={action.screen}
              onClick={() => handleNavigate(action.screen)}
              title={action.label}
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${radialOpen ? 1 : 0.2})`,
                opacity: radialOpen ? 1 : 0,
                backgroundColor: "rgba(30, 41, 59, 0.95)",
                transition: `transform 320ms cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms, opacity 220ms ease ${delay}ms`,
                pointerEvents: radialOpen ? "auto" : "none",
              }}
              className="absolute w-12 h-12 rounded-full shadow-xl text-white border border-white/20 flex items-center justify-center group active:scale-95"
            >
              <ActionIcon size={fab.iconSize - 2} />
              <span className="absolute -top-8 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-medium">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════
          FAB Button
          ════════════════════════════════════════════════════════ */}
      <div
        className="fixed z-50 md:hidden"
        style={{
          bottom: "2rem",
          ...(fabSide === "right"
            ? { right: "2rem", left: "auto" }
            : { left: "2rem", right: "auto" }),
          transform: `translateX(${dragOffsetX}px)`,
          transition: isDragging
            ? "none"
            : "left 300ms cubic-bezier(0.34,1.56,0.64,1), right 300ms cubic-bezier(0.34,1.56,0.64,1), transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="relative touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <button
            onMouseDown={startPress}
            onMouseUp={cancelPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onClick={handleFabClick}
            aria-label={fabActive ? "Close navigation" : "Open navigation menu"}
            style={{
              background: fabActive
                ? "rgb(15, 23, 42)"
                : "linear-gradient(to top right, #004ba0, #1e6bfa)",
              border: "1px solid rgba(255,255,255,0.4)",
              width: `${fab.fabSize}px`,
              height: `${fab.fabSize}px`,
            }}
            className={cn(
              "relative rounded-full flex items-center justify-center shadow-2xl",
              "hover:scale-105 active:scale-95 transition-transform duration-200 text-white"
            )}
          >
            {/* Long-press progress ring (amber) */}
            {holdProgress > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10">
                <circle cx={fab.fabSize / 2} cy={fab.fabSize / 2} r={(fab.fabSize / 2) - 3} stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
                <circle cx={fab.fabSize / 2} cy={fab.fabSize / 2} r={(fab.fabSize / 2) - 3} stroke="#f59e0b" strokeWidth="3" fill="none"
                  strokeDasharray={2 * Math.PI * ((fab.fabSize / 2) - 3)} strokeDashoffset={2 * Math.PI * ((fab.fabSize / 2) - 3) - (2 * Math.PI * ((fab.fabSize / 2) - 3) * holdProgress) / 100} strokeLinecap="round" />
              </svg>
            )}
            <div className={cn("transition-transform duration-300", fabActive ? "rotate-90" : "")}>
              {fabActive ? <X size={Math.round(fab.fabSize * 0.39)} /> : <MoreVertical size={Math.round(fab.fabSize * 0.39)} />}
            </div>
          </button>
        </div>
      </div>

      {/* ── Keyframe animations (kept from original BottomNav) ── */}
      <style>{`
        @keyframes caciPopRight {
          0%   { opacity: 0; transform: scale(0.3) translateY(20px) translateX(20px); }
          65%  { opacity: 1; transform: scale(1.04) translateY(-4px) translateX(0); }
          100% { opacity: 1; transform: scale(1) translateY(0) translateX(0); }
        }
        @keyframes caciPopLeft {
          0%   { opacity: 0; transform: scale(0.3) translateY(20px) translateX(-20px); }
          65%  { opacity: 1; transform: scale(1.04) translateY(-4px) translateX(0); }
          100% { opacity: 1; transform: scale(1) translateY(0) translateX(0); }
        }
      `}</style>
    </>
  );
}

export function BottomNav({ role, unreadCount = 0 }: { role: "admin" | "member"; unreadCount?: number }) {
  if (role === "member") {
    return <MemberFABNav unreadCount={unreadCount} />;
  }

  const { screen, navigate, resetTo, user, setUser, clearSession } = useApp();

  /* ── Popup / More drawer state ── */
  const [isPopupOpen, setIsPopupOpen]   = useState(false);
  const [drawerOpen,  setDrawerOpen]    = useState(false);
  const [activeCell,  setActiveCell]    = useState<string | null>(null);
  const [pressedCell, setPressedCell]   = useState<string | null>(null);

  /* ── CTA side + drag state ── */
  const [ctaSide,     setCtaSide]       = useState<"right" | "left">("right");
  const [isDragging,  setIsDragging]    = useState(false);
  const [dragOffsetX, setDragOffsetX]   = useState(0);
  const dragStartRef  = useRef<{ x: number; initialSide: "right" | "left" }>({ x: 0, initialSide: "right" });
  const containerRef  = useRef<HTMLDivElement>(null);

  const primaryItems   = role === "admin" ? adminNav       : memberNav;
  const quickActions   = role === "admin" ? adminQuickActions : memberQuickActions;
  const menuSections   = role === "admin" ? adminSidebarItems : memberSidebarItems;

  /* ── Active-state helpers ── */
  const isPrimaryActive = (item: NavItem) => {
    if (screen === item.screen) return true;
    if (role === "admin") {
      if (item.screen === "admin-members"    && screen.startsWith("admin-member"))    return true;
      if (item.screen === "admin-groups"     && screen.startsWith("admin-group"))     return true;
      if (item.screen === "admin-broadcasts" && screen.startsWith("admin-broadcast")) return true;
    } else {
      if (item.screen === "member-groups"     && (screen === "member-group-chat" || screen === "member-forum")) return true;
      if (item.screen === "member-broadcasts" && screen === "member-broadcast-detail")  return true;
      if (item.screen === "member-sermons"    && screen === "member-sermon-detail")     return true;
    }
    return false;
  };

  const handlePrimaryClick = (item: NavItem) => {
    setIsPopupOpen(false);
    if (item.screen === "admin-dashboard" || item.screen === "member-inbox") {
      resetTo(item.screen);
    } else {
      navigate(item.screen);
    }
  };

  /* ── Close popup on outside click or Escape ── */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopupOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPopupOpen(false);
    };
    if (isPopupOpen) {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("keydown",   handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown",   handleEsc);
    };
  }, [isPopupOpen]);

  /* ── Pointer drag handlers ── */
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, initialSide: ctaSide };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartRef.current.x;
    setDragOffsetX(Math.max(-240, Math.min(240, delta)));
  };
  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 60;
    if (dragStartRef.current.initialSide === "right" && dragOffsetX < -threshold) {
      setCtaSide("left");
      setIsPopupOpen(false);
    } else if (dragStartRef.current.initialSide === "left" && dragOffsetX > threshold) {
      setCtaSide("right");
      setIsPopupOpen(false);
    }
    setDragOffsetX(0);
  };

  const handleCtaClick = () => {
    if (Math.abs(dragOffsetX) > 10) return; // swallow drag-release as tap
    setIsPopupOpen((prev) => !prev);
  };

  return (
    <>
      {/* ── Floating bottom dock (mobile only) ── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-end justify-center pb-3 px-3 pointer-events-none"
        style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}
      >
        <div
          ref={containerRef}
          className={cn(
            "pointer-events-auto flex items-center gap-3 relative",
            ctaSide === "left" ? "flex-row-reverse" : "flex-row"
          )}
        >

          {/* ── Quick Actions Popup ── */}
          {isPopupOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+14px)] z-30 w-[270px] bg-white rounded-[24px] p-2",
                "border border-slate-200/80 shadow-[0_20px_50px_rgba(0,75,160,0.18),0_4px_16px_rgba(0,0,0,0.06)]",
                ctaSide === "left"
                  ? "left-0 origin-bottom-left animate-[caciPopLeft_420ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]"
                  : "right-0 origin-bottom-right animate-[caciPopRight_420ms_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]"
              )}
            >
              {/* Header */}
              <div className="bg-[#eff5ff] rounded-[18px] px-4 py-2.5 mb-2 flex justify-between items-center border border-[#c8dbff]">
                <span className="text-[13px] font-bold text-[#004ba0] tracking-tight">Quick Actions</span>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="w-5 h-5 rounded-full bg-[#daeaff] hover:bg-[#c8dbff] text-[#004ba0] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                  aria-label="Close quick actions"
                >
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="1" y1="1" x2="11" y2="11" />
                    <line x1="1" y1="11" x2="11" y2="1" />
                  </svg>
                </button>
              </div>

              {/* Action grid */}
              <div className="px-1 pb-1 pt-1 grid grid-cols-3 gap-y-2.5 gap-x-1">
                {quickActions.map((action) => {
                  const Icon  = action.Icon;
                  const isHov = activeCell  === action.label;
                  const isPrs = pressedCell === action.label;
                  return (
                    <button
                      key={action.label}
                      onMouseEnter={() => setActiveCell(action.label)}
                      onMouseLeave={() => setActiveCell(null)}
                      onMouseDown={() => setPressedCell(action.label)}
                      onMouseUp={() => setPressedCell(null)}
                      onClick={() => {
                        setIsPopupOpen(false);
                        navigate(action.screen);
                      }}
                      className={cn(
                        "group relative flex flex-col items-center justify-center py-2.5 px-1 rounded-[16px] transition-colors duration-150 cursor-pointer outline-none",
                        isHov ? "bg-[#eff5ff]" : "bg-transparent"
                      )}
                      style={{
                        transform: isPrs ? "scale(0.92)" : isHov ? "scale(1.02)" : "scale(1)",
                        transition: "transform 120ms cubic-bezier(0.2,0,0,1), background-color 150ms ease",
                        color: isHov ? "#004ba0" : "#484f58",
                      }}
                    >
                      <div className="mb-1.5">
                        <Icon />
                      </div>
                      <span className="text-[11.5px] tracking-tight text-center leading-tight font-medium">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Main nav pill ── */}
          <nav
            className="bg-white/95 backdrop-blur-md p-1.5 rounded-full border border-slate-200/90 shadow-[0_10px_30px_rgba(0,75,160,0.10),0_2px_8px_rgba(0,0,0,0.04)] flex items-center"
            aria-label="Primary navigation"
          >
            {primaryItems.map((tab) => {
              const Icon   = tab.Icon;
              const active = isPrimaryActive(tab);
              return (
                <button
                  key={tab.screen}
                  onClick={() => handlePrimaryClick(tab)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[20px] transition-all duration-200 cursor-pointer select-none",
                    active
                      ? "bg-[#eff5ff] text-[#004ba0] font-bold"
                      : "text-[#484f58] hover:text-[#004ba0] active:bg-[#eff5ff]/60"
                  )}
                >
                  <span className="relative inline-flex">
                    <Icon active={active} />
                    {tab.screen === "member-inbox" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-caci-red text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  {active && (
                    <span className="text-[11px] tracking-tight font-bold animate-in fade-in slide-in-from-left-2 duration-200 text-[#004ba0] whitespace-nowrap">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More button — opens drawer for secondary screens */}
            <button
              onClick={() => { setIsPopupOpen(false); setDrawerOpen(true); }}
              aria-label="More navigation options"
              className="relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[20px] transition-all duration-200 cursor-pointer select-none text-[#484f58] hover:text-[#004ba0] active:bg-[#eff5ff]/60"
            >
              <MoreDotsIcon active={drawerOpen} />
              {drawerOpen && (
                <span className="text-[11px] tracking-tight font-bold animate-in fade-in slide-in-from-left-2 duration-200 text-[#004ba0]">
                  More
                </span>
              )}
            </button>
          </nav>

          {/* ── Draggable CTA (+) button ── */}
          <div
            className="relative touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <button
              onClick={handleCtaClick}
              aria-label="Toggle Quick Actions"
              style={{
                transform: `translateX(${dragOffsetX}px) ${isPopupOpen ? "rotate(45deg)" : ""}`,
                transition: isDragging ? "none" : "transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#004ba0] to-[#1e6bfa] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(0,75,160,0.38)] hover:shadow-[0_14px_30px_rgba(0,75,160,0.48)] active:scale-95 transition-shadow cursor-grab active:cursor-grabbing"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5"  y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-slate-400 opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Drag to switch side
            </div>
          </div>

        </div>
      </div>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes caciPopRight {
          0%   { opacity: 0; transform: scale(0.3) translateY(20px) translateX(20px); }
          65%  { opacity: 1; transform: scale(1.04) translateY(-4px) translateX(0); }
          100% { opacity: 1; transform: scale(1) translateY(0) translateX(0); }
        }
        @keyframes caciPopLeft {
          0%   { opacity: 0; transform: scale(0.3) translateY(20px) translateX(-20px); }
          65%  { opacity: 1; transform: scale(1.04) translateY(-4px) translateX(0); }
          100% { opacity: 1; transform: scale(1) translateY(0) translateX(0); }
        }
      `}</style>

      {/* ── More / secondary screens drawer (mobile only) ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm bg-white p-0 border-l border-n100 shadow-2xl flex flex-col h-full z-50">
          <div className="bg-caci-blue text-white px-5 py-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-full ring-2 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.20)]">
                <CaciLogo size={40} className="rounded-full" />
              </div>
              <div>
                <h2 className="font-bold text-[15px] leading-tight tracking-tight">CACI Hub</h2>
                <p className="text-[11px] text-white/60 font-medium leading-tight">
                  {role === "admin" ? "Admin Portal" : "Member Portal"}
                </p>
              </div>
            </div>
          </div>

          {user && (
            <div className="mx-4 my-3 p-3 rounded-xl bg-caci-blue-bg/60 border border-caci-blue/15 flex items-center gap-3 shrink-0">
              <div className="size-10 rounded-full bg-caci-blue text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-n900 truncate">{user.fullName}</p>
                <p className="text-[12px] text-n400 capitalize">{user.role}</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scroll-caci px-3 py-2 space-y-4">
            {menuSections.map((sec) => (
              <div key={sec.section} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-n400">
                  {sec.section}
                </p>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isSelected = screen === item.screen;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => {
                          setDrawerOpen(false);
                          if (item.screen === "admin-dashboard" || item.screen === "member-inbox") {
                            resetTo(item.screen);
                          } else {
                            navigate(item.screen);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left group",
                          isSelected
                            ? "bg-caci-blue-bg text-caci-blue font-semibold shadow-xs"
                            : "text-n700 hover:bg-n50 hover:text-n900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isSelected ? "bg-caci-blue text-white" : "bg-n100/70 text-n500 group-hover:bg-n100 group-hover:text-n900"
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform group-hover:translate-x-0.5",
                            isSelected ? "text-caci-blue" : "text-n300"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-n100 bg-n50/50 flex flex-col gap-2 shrink-0">
            <button
              onClick={async () => {
                setDrawerOpen(false);
                try { await api.auth.logout(); } catch { /* ignore */ }
                clearSession();
                resetTo("login");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-caci-red hover:bg-caci-red-bg transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================================
// CACI Sidebar (desktop) — 240px, CACI Blue bg, white text
// ============================================================

// Sidebar uses Lucide icons (size/className props) — separate type from dock NavItem
interface SidebarNavItem {
  screen: Screen;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const adminSidebarItems: { section: string; items: SidebarNavItem[] }[] = [
  {
    section: "Main",
    items: [
      { screen: "admin-dashboard", label: "Dashboard", icon: LayoutDashboard },
      { screen: "admin-members", label: "Members", icon: Users },
      { screen: "admin-groups", label: "Groups", icon: UsersRound },
      { screen: "admin-attendance", label: "Attendance", icon: CalendarCheck },
    ],
  },
  {
    section: "Communication",
    items: [
      { screen: "admin-broadcasts", label: "Broadcasts", icon: Radio },
      { screen: "admin-sermons", label: "Sermons", icon: BookOpen },
      { screen: "admin-events", label: "Events", icon: Calendar },
      { screen: "admin-forum", label: "Assembly Forum", icon: MessageSquare },
    ],
  },
  {
    section: "Administration",
    items: [
      { screen: "admin-accounts", label: "User Accounts", icon: Shield },
      { screen: "admin-audit", label: "Audit Log", icon: ScrollText },
      { screen: "admin-settings", label: "Settings", icon: Settings },
    ],
  },
];

const memberSidebarItems: { section: string; items: SidebarNavItem[] }[] = [
  {
    section: "Personal",
    items: [
      { screen: "member-dashboard", label: "Home", icon: LayoutDashboard },
      { screen: "member-inbox", label: "Inbox", icon: Bell },
      { screen: "member-profile", label: "My Profile", icon: User },
    ],
  },
  {
    section: "Assembly",
    items: [
      { screen: "member-groups", label: "Chats", icon: MessageSquare },
      { screen: "member-broadcasts", label: "Broadcasts", icon: Radio },
      { screen: "member-sermons", label: "Sermons", icon: BookOpen },
      { screen: "member-events", label: "Events", icon: Calendar },
      { screen: "member-directory", label: "Directory", icon: Users },
    ],
  },
  {
    section: "Account",
    items: [
      { screen: "member-settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ role }: { role: "admin" | "member" }) {
  const { screen, navigate, resetTo, user } = useApp();
  const sections = role === "admin" ? adminSidebarItems : memberSidebarItems;

  // Collapse state — persisted to localStorage so it survives page refresh
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("caci-sidebar-collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("caci-sidebar-collapsed", String(next));
      return next;
    });
  };

  const isActive = (item: SidebarNavItem) => {
    if (screen === item.screen) return true;
    if (role === "admin") {
      if (item.screen === "admin-members" && screen.startsWith("admin-member")) return true;
      if (item.screen === "admin-groups" && screen.startsWith("admin-group")) return true;
      if (item.screen === "admin-broadcasts" && (screen.startsWith("admin-broadcast") || screen.startsWith("admin-sermon"))) return true;
    } else {
      if (item.screen === "member-groups" && screen === "member-group-chat") return true;
      if (item.screen === "member-broadcasts" && screen.startsWith("member-broadcast-detail")) return true;
      if (item.screen === "member-sermons" && screen === "member-sermon-detail") return true;
      if (item.screen === "member-profile" && screen === "member-profile-edit") return true;
    }
    return false;
  };

  const initials = user
    ? user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()
    : "";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-caci-blue text-white shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center border-b border-white/10 shrink-0",
        collapsed ? "justify-center px-0 py-4" : "gap-3 px-4 py-4"
      )}>
        <div className="shrink-0 rounded-full ring-2 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.20)]">
          <CaciLogo size={40} className="rounded-full" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="font-bold text-[15px] leading-tight tracking-tight whitespace-nowrap">CACI Hub</p>
            <p className="text-[11px] text-white/60 leading-tight truncate font-medium">
              {role === "admin" ? "Admin Portal" : "Member Portal"}
            </p>
          </div>
        )}
      </div>

      {/* User chip */}
      {user && (
        <div className={cn(
          "mx-2 my-3 rounded-lg bg-white/10 flex items-center shrink-0",
          collapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
        )}>
          <div
            className="size-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-semibold shrink-0"
            title={collapsed ? user.fullName : undefined}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[13px] font-medium truncate">{user.fullName}</p>
              <p className="text-[11px] text-white/60 capitalize">{user.role}</p>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-2 pb-4">
        {sections.map((sec) => (
          <div key={sec.section} className="mb-3">
            {/* Section label — only shown when expanded */}
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {sec.section}
              </p>
            )}
            {/* Divider line when collapsed */}
            {collapsed && (
              <div className="border-t border-white/10 my-2 mx-2" />
            )}
            <ul className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.screen}>
                    <button
                      onClick={() =>
                        item.screen === "admin-dashboard" || item.screen === "member-inbox"
                          ? resetTo(item.screen)
                          : navigate(item.screen)
                      }
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center py-2 rounded-md text-[14px] font-medium transition-colors text-left",
                        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                        active
                          ? collapsed
                            ? "bg-white/15 text-white"
                            : "bg-white/15 text-white border-l-2 border-caci-red pl-[10px]"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 px-2 py-2 shrink-0">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center py-2 px-3 rounded-md text-[13px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors",
            collapsed ? "justify-center px-0" : "gap-2.5"
          )}
        >
          {collapsed ? (
            <ChevronRight size={18} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={18} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Sign Out Footer */}
      <SidebarSignOut collapsed={collapsed} />
    </aside>
  );
}

function SidebarSignOut({ collapsed }: { collapsed?: boolean }) {
  const { clearSession, resetTo } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault(); // Don't close immediately
    setLoading(true);
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      setOpen(false);
      // Wait for Radix dialog close animation to complete before unmounting
      // Otherwise the body remains with pointer-events: none
      setTimeout(() => {
        clearSession();
        resetTo("login");
      }, 300);
    }
  };

  return (
    <>
      <div className="border-t border-white/10 px-2 py-2">
        <button
          onClick={() => setOpen(true)}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center py-2.5 rounded-md text-[14px] font-medium transition-colors text-left text-white/70 hover:bg-white/10 hover:text-white group",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          )}
        >
          <LogOut size={18} className="shrink-0 group-hover:text-red-400 transition-colors" />
          {!collapsed && "Sign Out"}
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 size-12 rounded-full bg-caci-red-bg flex items-center justify-center">
              <LogOut size={22} className="text-caci-red" />
            </div>
            <AlertDialogTitle className="text-center text-[18px]">Sign Out?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px]">
              You will be returned to the login screen. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex-col sm:flex-col gap-2">
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={loading}
              className="w-full bg-caci-red hover:bg-caci-red-dim text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Signing out…" : "Yes, Sign Out"}
            </AlertDialogAction>
            <AlertDialogCancel disabled={loading} className="w-full border border-n100 text-n700 hover:bg-n50 font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
// ============================================================
// CACI Top Header (mobile only) — shows brand + screen title
// ============================================================

export function MobileHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  const { back, user, setSearchOpen } = useApp();
  return (
    <header
      className="md:hidden sticky top-0 z-20 bg-caci-blue text-white px-4 py-3 flex items-center gap-3"
      style={{ paddingTop: "calc(0.75rem + var(--safe-top))" }}
    >
      {onBack && (
        <button
          onClick={() => {
            onBack();
          }}
          className="-ml-1 size-9 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20"
          aria-label="Go back"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[18px] font-bold leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[12px] text-white/70 truncate">{subtitle}</p>}
      </div>
      {/* Universal search icon — available on every screen */}
      <button
        onClick={() => setSearchOpen(true)}
        className="size-9 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 shrink-0"
        aria-label="Search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
      {/* Action slot — shown when provided */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
      {/* Avatar shown when no action and no back */}
      {user && !action && !onBack && (
        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-semibold shrink-0">
          {user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
        </div>
      )}
    </header>
  );
}

// ============================================================
// CACI Desktop Top Bar
// ============================================================

export function DesktopTopBar({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-n100 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="size-9 flex items-center justify-center rounded-lg border border-n200 bg-n50 text-n700 hover:bg-n100 hover:text-n900 transition-colors"
            aria-label="Go back"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-[22px] font-bold text-n900">{title}</h1>
          {subtitle && <p className="text-[14px] text-n400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
