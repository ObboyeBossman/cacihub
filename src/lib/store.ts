"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionUser } from "@/lib/types";

// ============================================================
// CACI Hub — App Router Store
// State-based SPA navigation backed by the browser's native
// history stack as the single source of truth.
//
// Every navigation entry (history.state) carries:
//   { screen: Screen, params: Record<string, string|undefined>, caciNav: true }
//
// navigate()  → history.pushState   (new entry on top)
// resetTo()   → history.replaceState (replace current entry — tab switches)
// back()      → history.back()       (browser pops, popstate syncs store)
//
// The store's `screen` and `params` are always a reflection of the
// CURRENT history entry. They are never persisted — the browser
// session history is the persistence layer, so re-mounts (full page
// refresh) restore the exact screen the user was on.
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

// Shape of the state object we stash in every history entry.
interface HistoryEntryState {
  screen: Screen;
  params: Record<string, string | undefined>;
  caciNav: true;
}

interface AppState {
  // session
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;

  // Persisted flag: true once the first /api/auth/me check has completed.
  // Survives re-mounts (same JS context) and is written to localStorage so
  // full-page refreshes also skip the loader. Cleared on logout so the next
  // load re-validates properly.
  sessionHydrated: boolean;
  setSessionHydrated: () => void;

  // Suspended account state — persisted so re-mounts don't lose it.
  suspended: boolean;
  suspendedName: string | undefined;
  setSuspended: (name?: string) => void;

  // Clears all session state (call on logout).
  clearSession: () => void;

  // navigation — browser history is the source of truth
  screen: Screen;
  params: Record<string, string | undefined>;
  navigate: (s: Screen) => void;
  back: () => void;
  resetTo: (s: Screen) => void;
  // Re-reads history.state and syncs screen+params into the store.
  // Called on mount and on every popstate.
  syncFromHistory: () => void;

  // Contextual params for the NEXT navigate call.
  // Usage pattern (unchanged from before):
  //   setParam("sermonId", id);
  //   navigate("member-sermon-detail");
  // setParam stages the value; navigate freezes it into a new history entry.
  setParam: (key: string, value: string | undefined) => void;
  clearParams: () => void;

  // ui state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // global search overlay
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

// ── Helpers: read the current history entry into store state ──────────────

function readHistoryEntry(): { screen: Screen; params: Record<string, string | undefined> } {
  if (typeof window === "undefined") {
    return { screen: "login", params: {} };
  }
  const raw = window.history.state as HistoryEntryState | null;
  if (raw && typeof raw.screen === "string" && raw.caciNav === true) {
    return {
      screen: raw.screen as Screen,
      params:
        raw.params && typeof raw.params === "object"
          ? { ...raw.params }
          : {},
    };
  }
  return { screen: "login", params: {} };
}

// Build the state object to pass into pushState/replaceState.
function buildEntryState(
  screen: Screen,
  params: Record<string, string | undefined>,
): HistoryEntryState {
  return { screen, params, caciNav: true };
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => {
      // Initialise screen + params from the current history entry so that a
      // full-page refresh restores the user's position instead of booting
      // them to the dashboard. On SSR this falls back to "login".
      const initial = readHistoryEntry();

      return {
        user: null,
        setUser: (u) => set({ user: u }),

        sessionHydrated: false,
        setSessionHydrated: () => set({ sessionHydrated: true }),

        suspended: false,
        suspendedName: undefined,
        setSuspended: (name) => set({ suspended: true, suspendedName: name, user: null }),

        clearSession: () =>
          set({ user: null, sessionHydrated: false, suspended: false, suspendedName: undefined }),

        // ── Navigation ────────────────────────────────────────────────────
        screen: initial.screen,
        params: initial.params,

        navigate: (s) => {
          // Freeze the currently-staged params into a new history entry.
          const params = { ...get().params };
          if (typeof window !== "undefined") {
            window.history.pushState(buildEntryState(s, params), "");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          set({ screen: s, params });
        },

        resetTo: (s) => {
          // Tab switches / post-login landing: replace the current entry so
          // the back button doesn't chain through old tabs.
          const params: Record<string, string | undefined> = {};
          if (typeof window !== "undefined") {
            window.history.replaceState(buildEntryState(s, params), "");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          set({ screen: s, params });
        },

        back: () => {
          // Let the browser do what it does natively. The popstate listener
          // in page.tsx will call syncFromHistory() to update the store.
          if (typeof window !== "undefined") {
            window.history.back();
          }
        },

        syncFromHistory: () => {
          const { screen, params } = readHistoryEntry();
          set({ screen, params });
        },

        setParam: (key, value) =>
          set((state) => ({ params: { ...state.params, [key]: value } })),
        clearParams: () => set({ params: {} }),

        sidebarOpen: false,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        searchOpen: false,
        setSearchOpen: (open) => set({ searchOpen: open }),
      };
    },
    {
      name: "caci-hub-store",
      // Persist user + sessionHydrated + suspended state.
      // Never persist screen, params, or stack-equivalent data — the browser
      // session history (history.state) is the source of truth for navigation
      // and survives full-page refreshes natively.
      partialize: (state) => ({
        user: state.user,
        sessionHydrated: state.sessionHydrated,
        suspended: state.suspended,
        suspendedName: state.suspendedName,
      }),
    },
  ),
);
