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
const MAINTENANCE_MODE = false;

// ── Splash: once per browser tab session ─────────────────────
// sessionStorage is cleared when the tab closes but survives
// history.pushState re-mounts — splash on first open, never again
// within the same tab.
const SPLASH_SHOWN_KEY = "caci_splash_shown";

export default function Home() {
  const {
    user, setUser,
    screen,
    sessionHydrated, setSessionHydrated,
    suspended, suspendedName, setSuspended,
    syncFromHistory,
  } = useApp();

  // showSplash: local state, never persisted. True only on the very first
  // mount of this tab (before sessionStorage has the splash key).
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  // ── Browser back-button support ───────────────────────────────────────
  // Navigation is driven by history.state (see lib/store.ts). The browser's
  // native history IS the navigation stack — no sentinel entries, no guard
  // pushing. When the user presses the device back button, the browser pops
  // one history entry and fires popstate; we re-read history.state into the
  // store and React re-renders the new screen. Home never re-mounts (the URL
  // stays "/"), so there is no loading flash and no session re-check.
  useEffect(() => {
    // On mount, make sure the store reflects the current history entry —
    // covers the full-page-refresh case where the user lands directly on a
    // sub-screen.
    syncFromHistory();

    const handlePopState = () => {
      syncFromHistory();
      // Match the scroll-to-top behaviour of in-app navigation.
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncFromHistory]);

  // ── Session check ─────────────────────────────────────────────────────
  // Runs only when sessionHydrated is false: genuine first page load or
  // after clearSession() (logout). Skipped entirely on back-button presses
  // (Home never re-mounts) and on full-page refreshes (sessionHydrated is
  // persisted in localStorage and remains true).
  useEffect(() => {
    if (sessionHydrated) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.auth.me();
        if (cancelled) return;
        if (res.suspended) {
          setSuspended(res.suspendedName);
        } else {
          setUser(res.user);
        }
      } catch {
        // No active session — user stays null, login screen shows
      } finally {
        if (!cancelled) setSessionHydrated();
      }
    })();
    return () => { cancelled = true; };
  }, [sessionHydrated, setUser, setSessionHydrated, setSuspended]);

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    setShowSplash(false);
  }, []);

  // ── Maintenance gate ──────────────────────────────────────────────────
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

  // ── Splash (first open of this tab only) ─────────────────────────────
  if (showSplash) {
    return (
      <SplashScreen
        sessionReady={sessionHydrated}
        onReady={handleSplashDone}
      />
    );
  }

  // ── Loading (only until first session check resolves) ─────────────────
  // After sessionHydrated is true once it is persisted — this gate is never
  // reached again on back-button presses or full-page refreshes.
  if (!sessionHydrated) {
    return <LoadingScreen message="Checking session…" />;
  }

  // ── Suspended account ─────────────────────────────────────────────────
  if (suspended) return <SuspendedScreen name={suspendedName} />;

  // ── Auth gates ────────────────────────────────────────────────────────
  if (!user) return <LoginScreen />;
  if (user.mustChangePassword) return <ChangePasswordScreen />;

  // ── Portal ────────────────────────────────────────────────────────────
  if (user.role === "admin") return <AdminPortal screen={screen} />;
  return <MemberPortal screen={screen} />;
}
