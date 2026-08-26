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
  ArrowLeftRight,
} from "lucide-react";
import { CaciAvatar, CaciLogo } from "./ui";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LoadingScreen } from "@/components/screens/LoadingScreen";

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

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#004ba0" : "#484f58"}
      strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function QADirectoryIcon() {
  return <MembersIcon active={false} />;
}

const adminNav: NavItem[] = [
  { screen: "admin-dashboard", label: "Home", Icon: HomeIcon },
  { screen: "admin-members", label: "Members", Icon: MembersIcon },
  { screen: "admin-sermons", label: "Sermons", Icon: SermonsIcon },
];

const memberNav: NavItem[] = [
  { screen: "member-dashboard", label: "Home", Icon: HomeIcon },
  { screen: "member-sermons", label: "Sermons", Icon: SermonsIcon },
  { screen: "member-directory", label: "Directory", Icon: MembersIcon },
  { screen: "member-profile", label: "Profile", Icon: ProfileIcon },
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
  { label: "Add Member", screen: "admin-member-add", Icon: QAAddMemberIcon },
  { label: "Add Sermon", screen: "admin-sermon-add", Icon: QAAddSermonIcon },
];

const memberQuickActions: QuickAction[] = [
  { label: "My Profile", screen: "member-profile", Icon: QAAddMemberIcon },
  { label: "Directory", screen: "member-directory", Icon: QADirectoryIcon },
];

// ============================================================
// Member Bottom Navigation (mobile-only) — floating pill dock
// Replaces the floating action button (FAB) for member portal.
// ============================================================

export function MemberBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { screen, navigate, resetTo } = useApp();

  const isItemActive = (item: NavItem) => {
    if (screen === item.screen) return true;
    if (item.screen === "member-sermons" && screen.startsWith("member-sermon")) return true;
    if (item.screen === "member-profile" && screen === "member-profile-edit") return true;
    return false;
  };

  const handleNavClick = (item: NavItem) => {
    if (item.screen === "member-dashboard") {
      resetTo(item.screen);
    } else {
      navigate(item.screen);
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-end justify-center pb-3 px-3 pointer-events-none"
      style={{ paddingBottom: "calc(0.75rem + var(--safe-bottom))" }}
    >
      <nav
        className="pointer-events-auto w-full max-w-sm bg-white/95 dark:bg-surface-nav/95 backdrop-blur-md rounded-[26px] p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_36px_rgba(0,75,160,0.14),0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-around"
        aria-label="Member navigation bar"
      >
        {memberNav.map((tab) => {
          const Icon = tab.Icon;
          const active = isItemActive(tab);
          return (
            <button
              key={tab.screen}
              onClick={() => handleNavClick(tab)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center min-h-[44px] py-1.5 px-2 rounded-[20px] transition-all duration-200 cursor-pointer select-none active:scale-95",
                active
                  ? "bg-caci-blue-bg dark:bg-blue-950/80 text-caci-blue dark:text-blue-300 font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-caci-blue dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              )}
            >
              <span className="relative inline-flex items-center justify-center">
                <Icon active={active} />
              </span>
              <span
                className={cn(
                  "text-[11px] tracking-tight transition-colors duration-200 mt-0.5",
                  active
                    ? "font-bold text-caci-blue dark:text-blue-300"
                    : "font-medium text-slate-600 dark:text-slate-400"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function BottomNav({ role, unreadCount = 0 }: { role: "admin" | "member"; unreadCount?: number }) {
  if (role === "member") {
    return <MemberBottomNav unreadCount={unreadCount} />;
  }

  return <AdminBottomNav unreadCount={unreadCount} />;
}

function AdminBottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const { screen, navigate, resetTo, user, setUser, clearSession, adminMobileMenuOpen, setAdminMobileMenuOpen, setAdminViewingAsMember } = useApp();

  /* ── Popup / More drawer state ── */
  const [isPopupOpen, setIsPopupOpen]   = useState(false);
  const [activeCell,  setActiveCell]    = useState<string | null>(null);
  const [pressedCell, setPressedCell]   = useState<string | null>(null);

  /* ── Drawer open state — synced with store so MobileHeader hamburger can open it ── */
  const drawerOpen    = adminMobileMenuOpen;
  const setDrawerOpen = (open: boolean) => setAdminMobileMenuOpen(open);

  /* ── Portal switch state ── */
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [switchLoading, setSwitchLoading]         = useState(false);

  /* ── CTA side + drag state ── */
  const [ctaSide,     setCtaSide]       = useState<"right" | "left">("right");
  const [isDragging,  setIsDragging]    = useState(false);
  const [dragOffsetX, setDragOffsetX]   = useState(0);
  const dragStartRef  = useRef<{ x: number; initialSide: "right" | "left" }>({ x: 0, initialSide: "right" });
  const containerRef  = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "admin";
  const primaryItems   = adminNav;
  const quickActions   = adminQuickActions;
  const menuSections   = adminSidebarItems;

  /* ── Active-state helpers ── */
  const isPrimaryActive = (item: NavItem) => {
    if (screen === item.screen) return true;
    if (role === "admin") {
      if (item.screen === "admin-members" && screen.startsWith("admin-member")) return true;
      if (item.screen === "admin-sermons" && screen.startsWith("admin-sermon")) return true;
    } else {
      if (item.screen === "member-sermons" && screen === "member-sermon-detail") return true;
    }
    return false;
  };

  const handlePrimaryClick = (item: NavItem) => {
    setIsPopupOpen(false);
    if (item.screen === "admin-dashboard" || item.screen === "member-dashboard") {
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
              <div className="bg-caci-blue-bg rounded-[18px] px-4 py-2.5 mb-2 flex justify-between items-center border border-caci-blue/20">
                <span className="text-[13px] font-bold text-caci-blue tracking-tight">Quick Actions</span>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="w-5 h-5 rounded-full bg-caci-blue-bg hover:bg-caci-blue/20 text-caci-blue flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
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
                        isHov ? "bg-caci-blue-bg" : "bg-transparent"
                      )}
                      style={{
                        transform: isPrs ? "scale(0.92)" : isHov ? "scale(1.02)" : "scale(1)",
                        transition: "transform 120ms cubic-bezier(0.2,0,0,1), background-color 150ms ease",
                        color: isHov ? "var(--color-caci-blue)" : "var(--color-n500)",
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
                      ? "bg-caci-blue-bg text-caci-blue font-bold"
                      : "text-n500 hover:text-caci-blue active:bg-caci-blue-bg/60"
                  )}
                >
                  <span className="relative inline-flex">
                    <Icon active={active} />
                  </span>
                  {active && (
                    <span className="text-[11px] tracking-tight font-bold animate-in fade-in slide-in-from-left-2 duration-200 text-caci-blue whitespace-nowrap">
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
              className="relative flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[20px] transition-all duration-200 cursor-pointer select-none text-n500 hover:text-caci-blue active:bg-caci-blue-bg/60"
            >
              <MoreDotsIcon active={drawerOpen} />
              {drawerOpen && (
                <span className="text-[11px] tracking-tight font-bold animate-in fade-in slide-in-from-left-2 duration-200 text-caci-blue">
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
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-caci-blue to-caci-blue-light text-white flex items-center justify-center shadow-[0_10px_25px_rgba(0,75,160,0.38)] hover:shadow-[0_14px_30px_rgba(0,75,160,0.48)] active:scale-95 transition-shadow cursor-grab active:cursor-grabbing"
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
              <CaciAvatar name={user.fullName} photoUrl={user.profilePhotoUrl} size={40} />
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
                          if (item.screen === "admin-dashboard" || item.screen === "member-dashboard") {
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
            {/* Switch to Member Portal */}
            <button
              onClick={() => { setDrawerOpen(false); setSwitchConfirmOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-caci-blue hover:bg-caci-blue-bg border border-caci-blue/20 transition-colors"
            >
              <ArrowLeftRight size={16} />
              Switch to Member Portal
            </button>
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

      {/* ── Portal Switch Loading Overlay ── */}
      {switchLoading && (
        <div className="fixed inset-0 z-[200]">
          <LoadingScreen message="Preparing your member experience…" />
        </div>
      )}

      {/* ── Switch to Member Portal — Confirmation Dialog ── */}
      <AlertDialog open={switchConfirmOpen} onOpenChange={setSwitchConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 size-12 rounded-full bg-caci-blue-bg flex items-center justify-center">
              <ArrowLeftRight size={22} className="text-caci-blue" />
            </div>
            <AlertDialogTitle className="text-center text-[18px]">Switch to Member Portal?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px]">
              You will be taken to the member view. You can return to the admin portal at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex-col sm:flex-col gap-2">
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                setSwitchConfirmOpen(false);
                // Brief settle before loader appears
                await new Promise((r) => setTimeout(r, 80));
                setSwitchLoading(true);
                // Guarantee at least 1 second of loading
                await new Promise((r) => setTimeout(r, 1000));
                setAdminViewingAsMember(true);
                setSwitchLoading(false);
                resetTo("member-dashboard");
              }}
              className="w-full bg-caci-blue hover:bg-caci-blue/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Yes, Switch Portal
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border border-n100 text-n700 hover:bg-n50 font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// Admin Mobile Drawer — always-mounted sheet controlled by store
// Rendered once in AdminPortal so it works regardless of whether
// BottomNav is present. Hamburger in MobileHeader fires
// setAdminMobileMenuOpen(true); this component listens and opens.
// ============================================================

export function AdminMobileDrawer() {
  const { screen, navigate, resetTo, user, clearSession, adminMobileMenuOpen, setAdminMobileMenuOpen, setAdminViewingAsMember } = useApp();
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [switchLoading, setSwitchLoading]         = useState(false);

  const close = () => setAdminMobileMenuOpen(false);

  return (
    <>
      {/* Portal Switch Loading Overlay */}
      {switchLoading && (
        <div className="fixed inset-0 z-[200]">
          <LoadingScreen message="Preparing your member experience…" />
        </div>
      )}

      {/* Main drawer sheet */}
      <Sheet open={adminMobileMenuOpen} onOpenChange={setAdminMobileMenuOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm bg-surface-overlay p-0 border-l border-n100 dark:border-slate-800 shadow-2xl flex flex-col h-full z-50">
          {/* Header */}
          <div className="bg-caci-blue dark:bg-surface-page text-white px-5 py-5 flex items-center justify-between shrink-0 border-b border-white/10 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-full ring-2 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.20)]">
                <CaciLogo size={40} className="rounded-full" />
              </div>
              <div>
                <h2 className="font-bold text-[15px] leading-tight tracking-tight">CACI Hub</h2>
                <p className="text-[11px] text-white/60 font-medium leading-tight">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* User chip */}
          {user && (
            <div className="mx-4 my-3 p-3 rounded-xl bg-caci-blue-bg/60 dark:bg-slate-800/80 border border-caci-blue/15 dark:border-slate-700/50 flex items-center gap-3 shrink-0">
              <CaciAvatar name={user.fullName} photoUrl={user.profilePhotoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-n900 dark:text-slate-100 truncate">{user.fullName}</p>
                <p className="text-[12px] text-n400 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
            </div>
          )}

          {/* Nav sections */}
          <div className="flex-1 overflow-y-auto scroll-caci px-3 py-2 space-y-4">
            {adminSidebarItems.map((sec) => (
              <div key={sec.section} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-n400 dark:text-slate-400">
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
                          close();
                          if (item.screen === "admin-dashboard") {
                            resetTo(item.screen);
                          } else {
                            navigate(item.screen);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left group",
                          isSelected
                            ? "bg-caci-blue-bg dark:bg-blue-950/80 text-caci-blue dark:text-blue-300 font-semibold shadow-xs"
                            : "text-n700 dark:text-slate-300 hover:bg-n50 dark:hover:bg-slate-800 hover:text-n900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isSelected ? "bg-caci-blue dark:bg-blue-600 text-white" : "bg-n100/70 dark:bg-slate-800 text-n500 dark:text-slate-400 group-hover:bg-n100 dark:group-hover:bg-slate-700 group-hover:text-n900 dark:group-hover:text-white"
                          )}>
                            <Icon size={18} />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight
                          size={16}
                          className={cn(
                            "transition-transform group-hover:translate-x-0.5",
                            isSelected ? "text-caci-blue dark:text-blue-300" : "text-n300 dark:text-slate-500"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-n100 dark:border-slate-800 bg-n50/50 dark:bg-slate-900/50 flex flex-col gap-2 shrink-0">
            <button
              onClick={() => { close(); setSwitchConfirmOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-caci-blue hover:bg-caci-blue-bg border border-caci-blue/20 transition-colors"
            >
              <ArrowLeftRight size={16} />
              Switch to Member Portal
            </button>
            <button
              onClick={async () => {
                close();
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

      {/* Switch to Member Portal — Confirmation Dialog */}
      <AlertDialog open={switchConfirmOpen} onOpenChange={setSwitchConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 size-12 rounded-full bg-caci-blue-bg flex items-center justify-center">
              <ArrowLeftRight size={22} className="text-caci-blue" />
            </div>
            <AlertDialogTitle className="text-center text-[18px]">Switch to Member Portal?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px]">
              You will be taken to the member view. You can return to the admin portal at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex-col sm:flex-col gap-2">
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                setSwitchConfirmOpen(false);
                await new Promise((r) => setTimeout(r, 80));
                setSwitchLoading(true);
                await new Promise((r) => setTimeout(r, 1000));
                setAdminViewingAsMember(true);
                setSwitchLoading(false);
                resetTo("member-dashboard");
              }}
              className="w-full bg-caci-blue hover:bg-caci-blue/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Yes, Switch Portal
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border border-n100 text-n700 hover:bg-n50 font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    ],
  },
  {
    section: "Management",
    items: [
      { screen: "admin-sermons", label: "Sermons", icon: BookOpen },
      { screen: "admin-settings", label: "Settings", icon: Settings },
    ],
  },
];

const memberSidebarItems: { section: string; items: SidebarNavItem[] }[] = [
  {
    section: "Personal",
    items: [
      { screen: "member-dashboard", label: "Home", icon: LayoutDashboard },
      { screen: "member-profile", label: "My Profile", icon: User },
    ],
  },
  {
    section: "Assembly",
    items: [
      { screen: "member-sermons", label: "Sermons", icon: BookOpen },
      { screen: "member-directory", label: "Directory", icon: Users },
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
      if (item.screen === "admin-sermons" && screen.startsWith("admin-sermon")) return true;
    } else {
      if (item.screen === "member-sermons" && screen.startsWith("member-sermon")) return true;
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
        "hidden md:flex flex-col bg-caci-blue dark:bg-surface-nav text-white shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out overflow-hidden border-r border-transparent dark:border-slate-800/80",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center border-b border-white/10 dark:border-slate-800 shrink-0",
        collapsed ? "justify-center px-0 py-4" : "gap-3 px-4 py-4"
      )}>
        <div className="shrink-0 rounded-full ring-2 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.20)]">
          <CaciLogo size={40} className="rounded-full" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <p className="font-bold text-[15px] leading-tight tracking-tight whitespace-nowrap">CACI Hub</p>
            <p className="text-[11px] text-white/60 dark:text-slate-400 leading-tight truncate font-medium">
              {role === "admin" ? "Admin Portal" : "Member Portal"}
            </p>
          </div>
        )}
      </div>

      {/* User chip */}
      {user && (
        <div className={cn(
          "mx-2 my-3 rounded-lg bg-white/10 dark:bg-slate-800/70 border border-transparent dark:border-slate-700/50 flex items-center shrink-0",
          collapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
        )}>
          <div title={collapsed ? user.fullName : undefined} className="shrink-0">
            <CaciAvatar name={user.fullName} photoUrl={user.profilePhotoUrl} size={32} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-[13px] font-medium truncate">{user.fullName}</p>
              <p className="text-[11px] text-white/60 dark:text-slate-400 capitalize">{user.role}</p>
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
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 dark:text-slate-500">
                {sec.section}
              </p>
            )}
            {/* Divider line when collapsed */}
            {collapsed && (
              <div className="border-t border-white/10 dark:border-slate-800 my-2 mx-2" />
            )}
            <ul className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.screen}>
                    <button
                      onClick={() =>
                        item.screen === "admin-dashboard" || item.screen === "member-dashboard"
                          ? resetTo(item.screen)
                          : navigate(item.screen)
                      }
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center py-2 rounded-md text-[14px] font-medium transition-colors text-left",
                        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                        active
                          ? collapsed
                            ? "bg-white/15 dark:bg-slate-800 text-white"
                            : "bg-white/15 dark:bg-slate-800/90 text-white border-l-2 border-caci-red pl-[10px]"
                          : "text-white/80 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/60 hover:text-white"
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
      <div className="border-t border-white/10 dark:border-slate-800 px-2 py-2 shrink-0">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center py-2 px-3 rounded-md text-[13px] font-medium text-white/60 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-800/60 hover:text-white transition-colors",
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
  const { user, clearSession, resetTo, screen, setAdminViewingAsMember, switchBackToAdmin } = useApp();
  const [open, setOpen]                         = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [switchLoading, setSwitchLoading]         = useState(false);

  const isAdminUser = user?.role === "admin";
  const isCurrentlyInAdminView = screen.startsWith("admin-");
  const switchLabel = isCurrentlyInAdminView ? "Member Portal" : "Admin Portal";
  const dialogTitle = isCurrentlyInAdminView ? "Switch to Member Portal?" : "Switch to Admin Portal?";
  const dialogDesc = isCurrentlyInAdminView
    ? "You will be taken to the member view. You can return to the admin portal at any time."
    : "You will be taken back to the admin portal.";
  const loadingMsg = isCurrentlyInAdminView
    ? "Preparing your member experience…"
    : "Preparing your admin dashboard…";

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault(); // Don't close immediately
    setLoading(true);
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      setOpen(false);
      setTimeout(() => {
        clearSession();
        resetTo("login");
      }, 300);
    }
  };

  const handleSwitchPortal = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSwitchConfirmOpen(false);
    await new Promise((r) => setTimeout(r, 80));
    setSwitchLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    if (isCurrentlyInAdminView) {
      setAdminViewingAsMember(true);
      setSwitchLoading(false);
      resetTo("member-dashboard");
    } else {
      setSwitchLoading(false);
      switchBackToAdmin();
    }
  };

  return (
    <>
      {/* Portal Switch Loading Overlay */}
      {switchLoading && (
        <div className="fixed inset-0 z-[200]">
          <LoadingScreen message={loadingMsg} />
        </div>
      )}

      <div className="border-t border-white/10 dark:border-slate-800 px-2 py-2 space-y-1">
        {/* Switch Portal button — only shown for Admin accounts */}
        {isAdminUser && (
          <button
            onClick={() => setSwitchConfirmOpen(true)}
            title={collapsed ? `Switch to ${switchLabel}` : undefined}
            className={cn(
              "w-full flex items-center py-2.5 rounded-md text-[14px] font-medium transition-colors text-left text-white/70 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/60 hover:text-white group",
              collapsed ? "justify-center px-0" : "gap-2.5 px-3"
            )}
          >
            <ArrowLeftRight size={18} className="shrink-0 group-hover:text-blue-300 transition-colors" />
            {!collapsed && switchLabel}
          </button>
        )}

        {/* Sign Out */}
        <button
          onClick={() => setOpen(true)}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "w-full flex items-center py-2.5 rounded-md text-[14px] font-medium transition-colors text-left text-white/70 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/60 hover:text-white group",
            collapsed ? "justify-center px-0" : "gap-2.5 px-3"
          )}
        >
          <LogOut size={18} className="shrink-0 group-hover:text-red-400 transition-colors" />
          {!collapsed && "Sign Out"}
        </button>
      </div>

      {/* Sign Out Confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-sm dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 size-12 rounded-full bg-caci-red-bg dark:bg-red-950/80 flex items-center justify-center">
              <LogOut size={22} className="text-caci-red dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-center text-[18px] dark:text-slate-100">Sign Out?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px] dark:text-slate-400">
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
            <AlertDialogCancel disabled={loading} className="w-full border border-n100 dark:border-slate-700 text-n700 dark:text-slate-300 hover:bg-n50 dark:hover:bg-slate-800 font-medium py-2.5 rounded-lg transition-colors">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch Portal Confirmation */}
      <AlertDialog open={switchConfirmOpen} onOpenChange={setSwitchConfirmOpen}>
        <AlertDialogContent className="max-w-sm dark:bg-slate-900 dark:border-slate-800">
          <AlertDialogHeader>
            <div className="mx-auto mb-3 size-12 rounded-full bg-caci-blue-bg dark:bg-blue-950/80 flex items-center justify-center">
              <ArrowLeftRight size={22} className="text-caci-blue dark:text-blue-400" />
            </div>
            <AlertDialogTitle className="text-center text-[18px] dark:text-slate-100">{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px] dark:text-slate-400">
              {dialogDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex-col sm:flex-col gap-2">
            <AlertDialogAction
              onClick={handleSwitchPortal}
              className="w-full bg-caci-blue hover:bg-caci-blue/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Yes, Switch Portal
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border border-n100 dark:border-slate-700 text-n700 dark:text-slate-300 hover:bg-n50 dark:hover:bg-slate-800 font-medium py-2.5 rounded-lg transition-colors">
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
  onMenu,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  action?: React.ReactNode;
}) {
  const { back, user, setSearchOpen } = useApp();
  return (
    <header
      className="md:hidden sticky top-0 z-20 bg-caci-blue dark:bg-surface-nav border-b border-transparent dark:border-slate-800 text-white px-4 py-3 flex items-center gap-3 transition-colors"
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
      {/* Hamburger — shown when onMenu is provided and there is no back button */}
      {onMenu && !onBack && (
        <button
          onClick={onMenu}
          className="-ml-1 size-9 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 shrink-0"
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[18px] font-bold leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[12px] text-white/70 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>
      {/* Action slot — shown when provided */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
      {/* Avatar shown when no action and no back */}
      {user && !action && !onBack && (
        <CaciAvatar name={user.fullName} photoUrl={user.profilePhotoUrl} size={32} />
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
    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-n100 dark:border-slate-800/80 bg-surface-card sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="size-9 flex items-center justify-center rounded-lg border border-n200 dark:border-slate-700 bg-n50 dark:bg-slate-800 text-n700 dark:text-slate-200 hover:bg-n100 dark:hover:bg-slate-700 transition-colors"
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
