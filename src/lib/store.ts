"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/types";

// ============================================================
// CACI Hub — App Router Store
// State-based SPA navigation (single `/` route per sandbox constraint)
// ============================================================

export type AdminScreen =
  | "admin-dashboard"
  | "admin-members"
  | "admin-member-detail"
  | "admin-member-edit"
  | "admin-member-add"
  | "admin-groups"
  | "admin-group-detail"
  | "admin-group-add"
  | "admin-broadcasts"
  | "admin-broadcast-compose"
  | "admin-broadcast-detail"
  | "admin-sermons"
  | "admin-sermon-series-add"
  | "admin-sermon-series-detail"
  | "admin-sermon-series-edit"
  | "admin-sermon-add"
  | "admin-sermon-edit"
  | "admin-sermon-detail"
  | "admin-accounts"
  | "admin-settings"
  | "admin-audit"
  | "admin-forum"
  | "admin-attendance"
  | "admin-events";

export type MemberScreen =
  | "member-inbox"
  | "member-dashboard"
  | "member-groups"
  | "member-group-chat"
  | "member-broadcasts"
  | "member-broadcast-detail"
  | "member-sermons"
  | "member-sermon-series"
  | "member-sermon-detail"
  | "member-profile"
  | "member-profile-edit"
  | "member-forum"
  | "member-settings"
  | "member-events"
  | "member-directory";

export type Screen = "login" | "admin" | "member" | AdminScreen | MemberScreen;

interface AppState {
  // session
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

  // Tracks whether the initial session check has completed at least once this
  // browser session. Persisted to localStorage so re-mounts (caused by
  // history.pushState in the back-button handler) skip the loading screen and
  // the API call entirely — the user state already in the store is the source
  // of truth until logout clears it.
  sessionHydrated: boolean;
  setSessionHydrated: () => void;
  clearSession: () => void;

  // navigation
  screen: Screen;
  stack: Screen[];
  navigate: (s: Screen) => void;
  back: () => void;
  resetTo: (s: Screen) => void;

  // contextual params (e.g. selected member id, group id, broadcast id)
  params: Record<string, string | undefined>;
  setParam: (key: string, value: string | undefined) => void;
  clearParams: () => void;

  // ui state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // global search overlay
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),

      sessionHydrated: false,
      setSessionHydrated: () => set({ sessionHydrated: true }),
      // Call on logout — clears user and resets hydration so the next mount
      // re-validates the session properly.
      clearSession: () => set({ user: null, sessionHydrated: false }),

      screen: "login",
      stack: [],
      navigate: (s) => {
        const { screen, stack } = get();
        set({ screen: s, stack: [...stack, screen] });
        // Push one browser history entry per in-app navigation so the browser
        // back button has exactly as many entries to pop as we have screens deep.
        if (typeof window !== "undefined") {
          window.history.pushState({ caciDepth: stack.length + 1 }, "");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
      back: () => {
        const { stack } = get();
        if (stack.length === 0) return;
        const newStack = [...stack];
        const prev = newStack.pop()!;
        set({ screen: prev, stack: newStack });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
      resetTo: (s) => {
        set({ screen: s, stack: [] });
        if (typeof window !== "undefined") {
          window.history.replaceState({ caciDepth: 0 }, "");
        }
      },

      params: {},
      setParam: (key, value) =>
        set((state) => ({ params: { ...state.params, [key]: value } })),
      clearParams: () => set({ params: {} }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: "caci-hub-store",
      // Persist user + sessionHydrated. Never persist screen or stack:
      // - stack is always empty after a real reload (browser history is gone)
      // - persisting screen causes the app to hydrate into a sub-page with an
      //   empty stack, making the back button immediately hit the base anchor.
      // sessionHydrated is persisted so re-mounts from history.pushState don't
      // flash the loader or re-run the /api/auth/me call unnecessarily.
      partialize: (state) => ({
        user: state.user,
        sessionHydrated: state.sessionHydrated,
      }),
    },
  ),
);
