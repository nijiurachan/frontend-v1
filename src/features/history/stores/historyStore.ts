import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

interface ViewedItem {
  id: number;
  ts: number;
}

interface HistoryState {
  viewed: ViewedItem[];
  addViewed: (threadId: number) => void;
  removeFromHistory: (threadId: number) => void;
  clearHistory: () => void;
  getViewedIds: () => number[];
}

const MAX_VIEWED = 100;

export const useHistoryStore: UseBoundStore<StoreApi<HistoryState>> =
  create<HistoryState>()(
    persist(
      (set, get) => ({
        viewed: [],

        addViewed(threadId: number): void {
          set((state) => {
            const filtered = state.viewed.filter((v) => v.id !== threadId);
            const newViewed = [{ id: threadId, ts: Date.now() }, ...filtered];
            return { viewed: newViewed.slice(0, MAX_VIEWED) };
          });
        },

        removeFromHistory(threadId: number): void {
          set((state) => ({
            viewed: state.viewed.filter((v) => v.id !== threadId),
          }));
        },

        clearHistory: () => set({ viewed: [] }),

        getViewedIds: () => get().viewed.map((v) => v.id),
      }),
      {
        name: "aimg-history",
      },
    ),
  );
