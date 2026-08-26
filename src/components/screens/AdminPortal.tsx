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
import { AdminSermons } from "@/components/screens/admin/AdminSermons";
import { AdminSermonAdd } from "@/components/screens/admin/AdminSermonAdd";
import { AdminSermonEdit } from "@/components/screens/admin/AdminSermonEdit";
import { AdminSermonDetail } from "@/components/screens/admin/AdminSermonDetail";
import { AdminSettings } from "@/components/screens/admin/AdminSettings";

const screenMap: Record<string, React.ComponentType> = {
  "admin-dashboard": AdminDashboard,
  "admin-members": AdminMembers,
  "admin-member-detail": AdminMemberDetail,
  "admin-member-edit": AdminMemberEdit,
  "admin-member-add": AdminMemberAdd,
  "admin-sermons": AdminSermons,
  "admin-sermon-add": AdminSermonAdd,
  "admin-sermon-edit": AdminSermonEdit,
  "admin-sermon-detail": AdminSermonDetail,
  "admin-settings": AdminSettings,
};

export function AdminPortal({ screen }: { screen: Screen }) {
  const { resetTo } = useApp();

  // If an admin lands on a member screen (e.g. after role change), reset.
  useEffect(() => {
    if (screen === "admin" || screen === "member" || screen === "login") {
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
