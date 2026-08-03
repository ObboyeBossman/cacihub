"use client";

import { useEffect, useState, useCallback } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { ChangePasswordScreen } from "@/components/screens/ChangePasswordScreen";
import { AdminPortal } from "@/components/screens/AdminPortal";
import { MemberPortal } from "@/components/screens/MemberPortal";
import { MaintenanceScreen } from "@/components/screens/MaintenanceScreen";
import { SuspendedScreen } from "@/components/screens/SuspendedScreen";

// ── Maintenance mode ──────────────────────────────────────────
// Set to true to show the upgrade screen to all users.
// Set back to false to re-enable normal access.
const MAINTENANCE_MODE = false;

// Splash is shown only once per browser session (first app launch).
// All subsequent loading states use the lightweight LoadingScreen.
const SPLASH_SHOWN_KEY = "caci_splash_shown";

type BootPhase = "splash" | "loading" | "ready";

function getInitialPhase(): BootPhase {
  if (typeof window === "undefined") return "splash";
  const shown = sessionStorage.getItem(SPLASH_SHOWN_KEY);
  return shown ? "loading" : "splash";
}

export default function Home() {
  const { user, setUser, screen } = useApp();
  const [phase, setPhase] = useState<BootPhase>(getInitialPhase);
  const [sessionReady, setSessionReady] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [suspendedName, setSuspendedName] = useState<string | undefined>(undefined);

  // ── Browser / hardware back button interception ───────────────────────────
  // Problem: pressing the device back button when the Zustand stack is empty
  // caused the browser to pop its own history and reload the page entirely.
  //
  // Root cause: a single replaceState anchor leaves no entry below it. When
  // popstate fires with stack.length === 0, re-pushing an entry races with the
  // browser completing the pop — the page reloads before our push lands.
  //
  // Fix: double-sentinel strategy.
  //   1. replaceState → sentinel-floor  (caciDepth: 0) — immovable floor
  //   2. pushState    → sentinel-guard  (caciDepth: 0) — absorbs every back press
  //
  // The browser always owns ≥2 entries. Back press consumes guard → lands on
  // floor (still our page, no reload). We immediately re-push guard and only
  // call goBack() when our Zustand stack has depth.
  useEffect(() => {
    window.history.replaceState({ caciDepth: 0, sentinel: "floor" }, "");
    window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");

    const handlePopState = () => {
      const { back: goBack, stack } = useApp.getState();
      // Restore the guard immediately so it is never permanently consumed.
      window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");
      if (stack.length > 0) {
        goBack();
      }
      // stack.length === 0 → already at root; guard re-push keeps us here.
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
        if (cancelled) return;
        if (res.suspended) {
          // Account suspended by an admin — show dedicated screen.
          setSuspended(true);
          setSuspendedName(res.suspendedName);
          setUser(null);
        } else {
          setUser(res.user);
        }
      } catch {
        // No session — user stays null, login screen will show
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [setUser]);

  // When skipping splash, advance to "ready" as soon as session resolves
  useEffect(() => {
    if (phase === "loading" && sessionReady) {
      setPhase("ready");
    }
  }, [phase, sessionReady]);

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    setPhase("ready");
  }, []);

  // Maintenance gate — flip MAINTENANCE_MODE above to enable
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

  // Non-first-launch: show lightweight loader while session resolves
  if (phase === "loading" && !sessionReady) {
    return <LoadingScreen message="Checking session…" />;
  }

  // First launch only: full splash screen with branding
  if (phase === "splash") {
    return (
      <SplashScreen
        sessionReady={sessionReady}
        onReady={handleSplashDone}
      />
    );
  }

  // Suspended account gate — full-screen state, no navigation, no back.
  // Takes precedence over the mustChangePassword gate.
  if (suspended) {
    return <SuspendedScreen name={suspendedName} />;
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
