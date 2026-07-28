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
  LogOut,
  Plus,
  UserPlus,
  Send,
  X,
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
  { screen: "member-inbox",      label: "Inbox",   Icon: InboxIcon },
  { screen: "member-groups",     label: "Chats",   Icon: ChatsIcon },
  { screen: "member-broadcasts", label: "Broadca...", Icon: BroadcastIcon },
  { screen: "member-sermons",    label: "Sermons", Icon: SermonsIcon },
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

export function BottomNav({ role }: { role: "admin" | "member" }) {
  const { screen, navigate, resetTo, user, setUser } = useApp();

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
                  <Icon active={active} />
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
              onClick={() => {
                setDrawerOpen(false);
                setUser(null);
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
    ],
  },
  {
    section: "Communication",
    items: [
      { screen: "admin-broadcasts", label: "Broadcasts", icon: Radio },
      { screen: "admin-sermons", label: "Sermons", icon: BookOpen },
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

  return (
    <aside className="hidden md:flex flex-col w-60 bg-caci-blue text-white shrink-0 sticky top-0 h-screen">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        {/* Logo — white ring + soft glow makes the real logo pop on the blue bg */}
        <div className="shrink-0 rounded-full ring-2 ring-white/30 shadow-[0_0_12px_rgba(255,255,255,0.20)]">
          <CaciLogo size={40} className="rounded-full" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-tight tracking-tight">CACI Hub</p>
          <p className="text-[11px] text-white/60 leading-tight truncate font-medium">Admin Portal</p>
        </div>
      </div>

      {/* User chip */}
      {user && (
        <div className="mx-3 my-3 rounded-lg bg-white/10 px-3 py-2 flex items-center gap-2">
          <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-semibold">
            {user.fullName.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">{user.fullName}</p>
            <p className="text-[11px] text-white/60 capitalize">{user.role}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-none px-2 pb-4">
        {sections.map((sec) => (
          <div key={sec.section} className="mb-3">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
              {sec.section}
            </p>
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
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] font-medium transition-colors text-left",
                        active
                          ? "bg-white/15 text-white border-l-2 border-caci-red pl-[10px]"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign Out Footer */}
      <SidebarSignOut />
    </aside>
  );
}

function SidebarSignOut() {
  const { setUser, resetTo } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch {
      // ignore — clear local state anyway
    } finally {
      setUser(null);
      resetTo("login");
    }
  };

  return (
    <>
      <div className="border-t border-white/10 px-3 py-3">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] font-medium transition-colors text-left text-white/70 hover:bg-white/10 hover:text-white group"
        >
          <LogOut size={18} className="shrink-0 group-hover:text-red-400 transition-colors" />
          Sign Out
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
  const { back, user } = useApp();
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
      {/* Action slot — always shown when provided; avatar shown when no action and no back */}
      {action && (
        <div className="shrink-0">{action}</div>
      )}
      {user && !action && (
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
