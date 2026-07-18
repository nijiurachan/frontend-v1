import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { isUuidThreadId } from "@/shared/lib/threadIdMigration";

export const POSTED_HISTORY_MAX_ITEMS = 100;
export const POSTED_HISTORY_MAX_AGE_MS: number = 30 * 24 * 60 * 60 * 1_000;

export interface PostedHistoryItem {
  id: string;
  ts: number;
}

interface PostedHistoryState {
  posted: PostedHistoryItem[];
  addPosted: (threadId: string) => void;
  clearPostedHistory: () => void;
  getPostedIds: () => string[];
}

export const usePostedHistoryStore: UseBoundStore<
  StoreApi<PostedHistoryState>
> = create<PostedHistoryState>()(
  persist(
    (set, get) => ({
      posted: [],
      addPosted: (threadId: string) => {
        const now = Date.now();
        set((state) => ({
          posted: [
            { id: threadId, ts: now },
            ...state.posted.filter(
              (item) =>
                item.id !== threadId &&
                now - item.ts <= POSTED_HISTORY_MAX_AGE_MS,
            ),
          ].slice(0, POSTED_HISTORY_MAX_ITEMS),
        }));
      },
      clearPostedHistory: () => set({ posted: [] }),
      getPostedIds: () => {
        const now = Date.now();
        const active = get().posted.filter(
          (item) => now - item.ts <= POSTED_HISTORY_MAX_AGE_MS,
        );
        return active.map((item) => item.id);
      },
    }),
    {
      name: "aimg-posted-history",
      version: 1,
      migrate: migratePostedHistory,
    },
  ),
);

export function migratePostedHistory(persisted: unknown): unknown {
  if (!isRecord(persisted) || !Array.isArray(persisted.posted)) {
    return { posted: [] };
  }
  const now = Date.now();
  return {
    ...persisted,
    posted: persisted.posted.flatMap((item): PostedHistoryItem[] => {
      if (
        !isRecord(item) ||
        !isUuidThreadId(item.id) ||
        typeof item.ts !== "number" ||
        !Number.isFinite(item.ts) ||
        now - item.ts > POSTED_HISTORY_MAX_AGE_MS
      ) {
        return [];
      }
      return [{ id: item.id, ts: item.ts }];
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
