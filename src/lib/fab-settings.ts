"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FabSettings {
  radialRadius: number;    // 80 – 220 px
  radialStartAngle: number; // 60 – 150 deg
  radialEndAngle: number;   // 150 – 220 deg
  backdropOpacity: number;  // 0 – 0.8
  iconSize: number;         // 14 – 28 px
  fabSize: number;          // 44 – 72 px
  cardWidth: number;        // 220 – 380 px
  cardMaxHeight: number;    // 280 – 560 px
  holdDuration: number;     // 200 – 1000 ms
  dragThreshold: number;    // 20 – 120 px
}

export const FAB_DEFAULTS: FabSettings = {
  radialRadius: 140,
  radialStartAngle: 100,
  radialEndAngle: 170,
  backdropOpacity: 0.4,
  iconSize: 20,
  fabSize: 56,
  cardWidth: 300,
  cardMaxHeight: 440,
  holdDuration: 500,
  dragThreshold: 60,
};

interface FabSettingsState {
  fab: FabSettings;
  setFab: (patch: Partial<FabSettings>) => void;
  resetFab: () => void;
}

export const useFabSettings = create<FabSettingsState>()(
  persist(
    (set) => ({
      fab: { ...FAB_DEFAULTS },
      setFab: (patch) =>
        set((s) => ({ fab: { ...s.fab, ...patch } })),
      resetFab: () => set({ fab: { ...FAB_DEFAULTS } }),
    }),
    { name: "caci-fab-settings" },
  ),
);
