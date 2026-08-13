"use client";

import { useEffect } from "react";
import { useApp, type Screen } from "@/lib/store";
import { Sidebar, AdminMobileDrawer } from "@/components/caci/nav";

// Admin screens no longer gate on ROOT_SCREENS — the mobile drawer and the
// Quick Actions FAB are now available on EVERY admin screen (matching how the
// desktop Sidebar is always visible). Kept for backwards-compat reference.

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
import { AdminBroadcastDetail } from "@/components/screens/admin/AdminBroadcastDetail";
import { AdminSermons } from "@/components/screens/admin/AdminSermons";
import { AdminSermonAdd } from "@/components/screens/admin/AdminSermonAdd";
import { AdminSermonEdit } from "@/components/screens/admin/AdminSermonEdit";
import { AdminSermonSeriesAdd } from "@/components/screens/admin/AdminSermonSeriesAdd";
import { AdminSermonSeriesDetail } from "@/components/screens/admin/AdminSermonSeriesDetail";
import { AdminSermonDetail } from "@/components/screens/admin/AdminSermonDetail";
import { AdminAccounts } from "@/components/screens/admin/AdminAccounts";
import { AdminSettings } from "@/components/screens/admin/AdminSettings";
import { AdminAudit } from "@/components/screens/admin/AdminAudit";
import { AdminForum } from "@/components/screens/admin/AdminForum";
import { AdminAttendance } from "@/components/screens/admin/AdminAttendance";
import { AdminEvents } from "@/components/screens/admin/AdminEvents";

// AdminSermonSeriesEdit reuses the Add form with no existing prop needed —
// the SeriesAdd screen reads params.seriesId when in edit mode.
// But AdminSermonSeriesDetail navigates to "admin-sermon-series-edit", so we
// need a thin wrapper that passes the existing series from params.
import { AdminSermonSeriesEdit } from "@/components/screens/admin/AdminSermonSeriesEdit";

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
  "admin-broadcast-detail": AdminBroadcastDetail,
  "admin-sermons": AdminSermons,
  "admin-sermon-add": AdminSermonAdd,
  "admin-sermon-edit": AdminSermonEdit,
  "admin-sermon-series-add": AdminSermonSeriesAdd,
  "admin-sermon-series-detail": AdminSermonSeriesDetail,
  "admin-sermon-series-edit": AdminSermonSeriesEdit,
  "admin-sermon-detail": AdminSermonDetail,
  "admin-accounts": AdminAccounts,
  "admin-settings": AdminSettings,
  "admin-audit": AdminAudit,
  "admin-forum": AdminForum,
  "admin-attendance": AdminAttendance,
  "admin-events": AdminEvents,
};

export function AdminPortal({ screen }: { screen: Screen }) {
  const { resetTo } = useApp();

  // If an admin lands on a member screen (e.g. after role change), reset.
  useEffect(() => {
    if (screen === "admin" || screen === "member" || screen === "login") {
      resetTo("admin-dashboard");
    }
    if (screen.startsWith("member-")) {
      resetTo("admin-dashboard");
    }
  }, [screen, resetTo]);

  const ActiveScreen = screenMap[screen] || AdminDashboard;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">
          <ActiveScreen />
        </main>
      </div>
      {/* Admin mobile drawer — always mounted so the hamburger in MobileHeader
          can open it from any screen. Controlled via adminMobileMenuOpen store. */}
      <AdminMobileDrawer />
    </div>
  );
}
