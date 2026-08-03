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
// sessionStorage is cleared when the tab closes but survives history.pushState
// re-mounts — exactly the behaviour we want: splash on first open, never again
// within the same tab, even when the back button triggers a re-mount.
const SPLASH_SHOWN_KEY = "caci_splash_shown";

export default function Home() {
  const {
    user, setUser,
    screen,
    sessionHydrated, setSessionHydrated,
    suspended, suspendedName, setSuspended,
  } = useApp();

  // showSplash: local state, never persisted. True only on the very first
  // mount of this tab (before sessionStorage has the splash key).
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_SHOWN_KEY);
  });

  // ── Browser / hardware back button interception ───────────────────────────
  // Double-sentinel: two owned history entries so the browser never drains
  // below our page.
  //
  //   replaceState → sentinel-floor  (immovable floor, never consumed)
  //   pushState    → sentinel-guard  (absorbs every back press)
  //
  // Back press: guard consumed → land on floor (still our page, no reload) →
  // guard immediately re-pushed → goBack() pops Zustand stack if non-empty.
  //
  // Note: history.pushState on the same pathname does NOT trigger a Next.js
  // re-render/re-mount, so sessionHydrated stays true and the loader never
  // flashes after the initial load.
  useEffect(() => {
    window.history.replaceState({ caciDepth: 0, sentinel: "floor" }, "");
    window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");

    const handlePopState = () => {
      const { back: goBack, stack } = useApp.getState();
      window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");
      if (stack.length > 0) {
        goBack();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Session check ─────────────────────────────────────────────────────────
  // Runs only when sessionHydrated is false: genuine first page load or after
  // clearSession() (logout). Skipped entirely on back-button re-mounts because
  // sessionHydrated is persisted in localStorage and remains true.
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

  // ── Maintenance gate ──────────────────────────────────────────────────────
  if (MAINTENANCE_MODE) return <MaintenanceScreen />;

  // ── Splash (first open of this tab only) ─────────────────────────────────
  if (showSplash) {
    return (
      <SplashScreen
        sessionReady={sessionHydrated}
        onReady={handleSplashDone}
      />
    );
  }

  // ── Loading (only until first session check resolves) ─────────────────────
  // After sessionHydrated is true once it is persisted — this gate is never
  // reached again on back-button re-mounts or fast refreshes.
  if (!sessionHydrated) {
    return <LoadingScreen message="Checking session…" />;
  }

  // ── Suspended account ─────────────────────────────────────────────────────
  if (suspended) return <SuspendedScreen name={suspendedName} />;

  // ── Auth gates ────────────────────────────────────────────────────────────
  if (!user) return <LoginScreen />;
  if (user.mustChangePassword) return <ChangePasswordScreen />;

  // ── Portal ────────────────────────────────────────────────────────────────
  if (user.role === "admin") return <AdminPortal screen={screen} />;
  return <MemberPortal screen={screen} />;
}
