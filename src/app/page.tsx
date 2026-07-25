"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ChangePasswordScreen } from "@/components/screens/ChangePasswordScreen";
import { AdminPortal } from "@/components/screens/AdminPortal";
import { MemberPortal } from "@/components/screens/MemberPortal";
import { MaintenanceScreen } from "@/components/screens/MaintenanceScreen";

// ── Maintenance mode ──────────────────────────────────────────
// Set to true to show the upgrade screen to all users.
// Set back to false to re-enable normal access.
const MAINTENANCE_MODE = false;

type BootPhase = "splash" | "ready";

export default function Home() {
  const { user, setUser, screen } = useApp();
  const [phase, setPhase] = useState<BootPhase>("splash");
  const [sessionReady, setSessionReady] = useState(false);

  // Kick off session check immediately — splash listens to sessionReady
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.auth.me();
        if (!cancelled) setUser(res.user);
      } catch {
        // No session — user stays null, login screen will show
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [setUser]);

  const handleSplashDone = useCallback(() => {
    setPhase("ready");
  }, []);

  // Maintenance gate — flip MAINTENANCE_MODE above to enable
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

  // Show splash (includes session check orchestration)
  if (phase === "splash") {
    return (
      <SplashScreen
        sessionReady={sessionReady}
        onReady={handleSplashDone}
      />
    );
  }

  // Post-splash: not logged in → login
  if (!user) {
    return <LoginScreen />;
  }

  // First-login gate
  if (user.mustChangePassword) {
    return <ChangePasswordScreen />;
  }

  // Logged in → portal
  if (user.role === "admin") {
    return <AdminPortal screen={screen} />;
  }
  return <MemberPortal screen={screen} />;
}
