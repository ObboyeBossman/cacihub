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

  // ╌╌ Browser / hardware back button interception ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
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
}  // ╌╌ Browser / hardware back button interception ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
  // Problem: pressing the device back button when the Zustand stack is empty
  // caused the browser to pop its own history and reload the page entirely.
  //
  // Root cause: a single replaceState anchor leaves no entry below it. When
  // popstate fires with stack.length === 0, re-pushing a new entry races with
  // the browser completing its pop — the page reloads before our push lands.
  //
  // Fix: double-sentinel strategy.
  //   1. replaceState → sentinel-floor  (caciDepth: 0) — immovable floor
  //   2. pushState    → sentinel-guard  (caciDepth: 0) — absorbs each back press
  //
  // The browser always has ≥2 owned entries. When back is pressed, guard is
  // consumed and we land on floor — still our page, no reload. We immediately
  // re-push guard and call goBack() only if our Zustand stack has depth.
  useEffect(() => {
    window.history.replaceState({ caciDepth: 0, sentinel: "floor" }, "");
    window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");

    const handlePopState = () => {
      const { back: goBack, stack } = useApp.getState();
      // Restore guard immediately so it is never permanently consumed.
      window.history.pushState({ caciDepth: 0, sentinel: "guard" }, "");
      if (stack.length > 0) {
        goBack();
      }
      // stack.length === 0 → already at root, guard re-push keeps us here.
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
ient";

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
