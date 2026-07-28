"use client";

import { useEffect } from "react";
import { useApp, type Screen } from "@/lib/store";
import { Sidebar, BottomNav } from "@/components/caci/nav";

// Screens that are top-level tabs — bottom nav is visible only here
const ROOT_SCREENS: Screen[] = [
  "admin-dashboard",
  "admin-members",
  "admin-groups",
  "admin-broadcasts",
];
import { AdminDashboard } from "@/components/screens/admin/AdminDashboard";
import { AdminMembers } from "@/components/screens/admin/AdminMembers";
import { AdminMemberDetail } from "@/components/screens/admin/AdminMemberDetail";
import { AdminMemberEdit } from "@/components/screens/admin/AdminMemberEdit";
import { AdminMemberAdd } from "@/components/screens/admin/AdminMemberAdd";
import { AdminGroups } from "@/components/screens/admin/AdminGroups";
import { AdminGroupDetail } from "@/components/screens/admin/AdminGroupDetail";
import { AdminGroupAdd } from "@/components/screens/admin/AdminGroupAdd";
import { AdminBroadcasts } from "@/components/screens/admin/AdminBroadcasts";
import { AdminBroadcastCompose } from "@/components/screens/admin/AdminBroadcastCompose";
import { AdminSermons } from "@/components/screens/admin/AdminSermons";
import { AdminSermonAdd } from "@/components/screens/admin/AdminSermonAdd";
import { AdminAccounts } from "@/components/screens/admin/AdminAccounts";
import { AdminSettings } from "@/components/screens/admin/AdminSettings";
import { AdminAudit } from "@/components/screens/admin/AdminAudit";
import { AdminForum } from "@/components/screens/admin/AdminForum";

const screenMap: Record<string, React.ComponentType> = {
  "admin-dashboard": AdminDashboard,
  "admin-members": AdminMembers,
  "admin-member-detail": AdminMemberDetail,
  "admin-member-edit": AdminMemberEdit,
  "admin-member-add": AdminMemberAdd,
  "admin-groups": AdminGroups,
  "admin-group-detail": AdminGroupDetail,
  "admin-group-add": AdminGroupAdd,
  "admin-broadcasts": AdminBroadcasts,
  "admin-broadcast-compose": AdminBroadcastCompose,
  "admin-sermons": AdminSermons,
  "admin-sermon-add": AdminSermonAdd,
  "admin-accounts": AdminAccounts,
  "admin-settings": AdminSettings,
  "admin-audit": AdminAudit,
  "admin-forum": AdminForum,
};

export function AdminPortal({ screen }: { screen: Screen }) {
  const { user, resetTo, back, stack } = useApp();

  // If an admin lands on a member screen (e.g. after role change), reset.
  useEffect(() => {
    if (screen === "admin" || screen === "member" || screen === "login") {
      resetTo("admin-dashboard");
    }
    if (screen.startsWith("member-")) {
      resetTo("admin-dashboard");
    }
  }, [screen, resetTo]);

  // Intercept the browser/phone hardware back button — call our in-app back()
  // instead of letting the browser navigate away from the SPA.
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (stack.length > 0) {
        back();
        // Re-push a state entry so the browser always has somewhere to "go back to"
        window.history.pushState({ caciApp: true }, "");
      } else {
        // At root — re-push to prevent the browser from going to a previous site
        window.history.pushState({ caciApp: true }, "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [back, stack]);

  const isRootScreen = ROOT_SCREENS.includes(screen);
  const Screen = screenMap[screen] || AdminDashboard;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <main className={isRootScreen ? "flex-1 pb-24 md:pb-0" : "flex-1"}>
          <Screen />
        </main>
      </div>
      {isRootScreen && <BottomNav role="admin" />}
    </div>
  );
}
