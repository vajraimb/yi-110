import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CastMethod } from "./cast.ts";

export type HistoryEntry = {
  id: string;
  method: CastMethod;
  gen?: number;
  /** Only set when the asker placed the head somewhere other than the seed's. */
  head?: number;
  question: string;
  at: number;
  benKing: number;
  zhiKing: number;
  changes: number;
};

type HistoryState = {
  entries: HistoryEntry[];
  remember: (entry: HistoryEntry) => void;
  forget: (id: string, gen?: number, head?: number) => void;
  clear: () => void;
};

const LIMIT = 64;

function same(a: HistoryEntry, id: string, gen?: number, head?: number): boolean {
  return a.id === id && (a.gen ?? -1) === (gen ?? -1) && (a.head ?? -1) === (head ?? -1);
}

export const useHistory = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      remember: (entry) =>
        set((state) => ({
          entries: [
            entry,
            ...state.entries.filter((e) => !same(e, entry.id, entry.gen, entry.head)),
          ].slice(0, LIMIT),
        })),
      forget: (id, gen, head) =>
        set((state) => ({ entries: state.entries.filter((e) => !same(e, id, gen, head)) })),
      clear: () => set({ entries: [] }),
    }),
    { name: "yi110.history.v1" },
  ),
);
