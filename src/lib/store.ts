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
  | "admin-forum";

export type MemberScreen =
  | "member-inbox"
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
  | "member-settings";

export type Screen = "login" | "admin" | "member" | AdminScreen | MemberScreen;

interface AppState {
  // session
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

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
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),

      screen: "login",
      stack: [],
      navigate: (s) => {
        const { screen, stack } = get();
        set({ screen: s, stack: [...stack, screen] });
        // Push one browser history entry per in-app navigation so the browser
        // back button has exactly as many entries to pop as we have screens deep.
        // This avoids the sentinel race: each press pops exactly one entry,
        // popstate fires, we call back(), and parity is maintained naturally.
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
        // Clear all our history entries back to the base anchor.
        // history.go(-n) would be async and unreliable; replaceState just
        // resets the current entry to depth 0 — good enough since stack is empty.
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
    }),
    {
      name: "caci-hub-store",
      // Persist only the user session. Never persist screen or stack:
      // - stack is always empty after reload (browser history is gone)
      // - persisting screen causes the app to hydrate into a sub-page whose
      //   stack is empty, so the back button immediately hits the base anchor
      //   and triggers a reload — exactly the "restart" symptom reported.
      // The session check in page.tsx will navigate to the correct root screen.
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);
