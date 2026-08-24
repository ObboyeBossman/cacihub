"use client";

import { useEffect, useState } from "react";
import { useApp, type Screen } from "@/lib/store";
import { Sidebar, BottomNav } from "@/components/caci/nav";
import { api } from "@/lib/api";

// Screens that are top-level tabs — bottom nav is visible only here
const ROOT_SCREENS: Screen[] = [
  "member-dashboard",
  "member-sermons",
  "member-directory",
  "member-profile",
];
import { MemberDashboard } from "@/components/screens/member/MemberDashboard";
import { MemberSermons } from "@/components/screens/member/MemberSermons";
import { MemberSermonDetail } from "@/components/screens/member/MemberSermonDetail";
import { MemberProfile } from "@/components/screens/member/MemberProfile";
import { MemberProfileEdit } from "@/components/screens/member/MemberProfileEdit";
import { MemberDirectory } from "@/components/screens/member/MemberDirectory";

const screenMap: Record<string, React.ComponentType> = {
  "member-dashboard": MemberDashboard,
  "member-sermons": MemberSermons,
  "member-sermon-detail": MemberSermonDetail,
  "member-profile": MemberProfile,
  "member-profile-edit": MemberProfileEdit,
  "member-directory": MemberDirectory,
};

export function MemberPortal({ screen }: { screen: Screen }) {
  const { resetTo, user } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread notifications every 30s so the inbox badge stays fresh
  // without requiring a manual reload.
  useEffect(() => {
    if (!user?.memberId) return;
    const fetchUnread = async () => {
      try {
        const res = await api.notifications.list(user.memberId, true);
        setUnreadCount(res.notifications.length);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [user?.memberId]);

  useEffect(() => {
    if (screen === "admin" || screen === "member" || screen === "login") {
      resetTo("member-dashboard");
    }
  }, [screen, resetTo]);

  const isRootScreen = ROOT_SCREENS.includes(screen);
  const Screen = screenMap[screen] || MemberDashboard;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role="member" />
      <div className="flex-1 flex flex-col min-w-0">
        <main className={isRootScreen ? "flex-1 pb-24 md:pb-0" : "flex-1"}>
          <Screen />
        </main>
      </div>
      {isRootScreen && <BottomNav role="member" unreadCount={unreadCount} />}
    </div>
  );
}
