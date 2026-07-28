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
  | "admin-sermons"
  | "admin-sermon-add"
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
        // Keep ONE sentinel entry in browser history above the base so popstate
        // always fires when the user presses back. We never push more than one,
        // so the browser never "runs out" of our entries and exits the app.
        if (typeof window !== "undefined") {
          window.history.pushState({ caciSentinel: true }, "");
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
          // Replace all browser history with just the base — no sentinel needed
          // since there's nothing to go back to in-app.
          window.history.replaceState({ caciBase: true }, "");
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
      // Persist the current screen so the app restores to the right place on
      // reload, but NEVER persist the stack. The stack mirrors browser history
      // entries from window.history.pushState — those are lost on page reload,
      // so a stale stack would cause back() to pop the store without a matching
      // browser entry, eventually falling through and triggering a full reload.
      partialize: (state) => ({
        screen: state.screen,
      }),
    },
  ),
);
