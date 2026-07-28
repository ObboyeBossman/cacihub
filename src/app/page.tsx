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

  // ── Browser / hardware back button interception ───────────────────────────
  // Strategy: push one browser history entry per navigate() call, so the
  // browser stack depth always matches our Zustand stack depth. popstate fires
  // once per back press, we call back() once, and the two stay in perfect sync.
  // No sentinel race, no re-push needed.
  //
  // On mount we lay down a base anchor (depth 0). Each navigate() above that
  // pushes caciDepth: N. The base anchor itself is never popped because
  // resetTo() replaces it rather than pushing, so the browser always has at
  // least one entry and never needs to leave the page.
  useEffect(() => {
    // Lay the base anchor — replaces whatever the browser's current entry is
    // so we own it and know it has caciDepth: 0.
    window.history.replaceState({ caciDepth: 0 }, "");

    const handlePopState = (e: PopStateEvent) => {
      const depth: number = e.state?.caciDepth ?? 0;
      const { back: goBack, stack } = useApp.getState();

      if (stack.length > 0) {
        // Normal in-app back — pop one screen.
        goBack();
      } else {
        // Stack is empty (we're at root). Re-push the base anchor so the
        // browser never navigates away — user is trapped at the root screen.
        window.history.pushState({ caciDepth: 0 }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
