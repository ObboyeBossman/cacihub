import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "series"; seriesId: string }
  | { name: "sermon"; sermonId: string; seriesId?: string };

interface SermonStore {
  view: View;
  goHome: () => void;
  openSeries: (seriesId: string) => void;
  openSermon: (sermonId: string, seriesId?: string) => void;
}

export const useSermonStore = create<SermonStore>((set) => ({
  view: { name: "home" },
  goHome: () => set({ view: { name: "home" } }),
  openSeries: (seriesId) => set({ view: { name: "series", seriesId } }),
  openSermon: (sermonId, seriesId) =>
    set({ view: { name: "sermon", sermonId, seriesId } }),
}));
