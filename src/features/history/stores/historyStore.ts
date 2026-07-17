import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

interface ViewedItem {
  id: string;
  ts: number;
  readReplyNumber: number;
}

interface HistoryState {
  viewed: ViewedItem[];
  addViewed: (threadId: string) => void;
  removeFromHistory: (threadId: string) => void;
  clearHistory: () => void;
  getViewedIds: () => string[];
  getReadReplyNumber: (threadId: string) => number | undefined;
  recordReadReplyNumber: (threadId: string, readReplyNumber: number) => void;
  getUnreadCount: (
    threadId: string,
    repliesCount: number,
  ) => number | undefined;
}

const MAX_VIEWED = 100;
// 「0レス既読」を表す readReplyNumber。backend-v1 の OP seq は 0 開始。
const INITIAL_READ_REPLY_NUMBER = 0;

export const useHistoryStore: UseBoundStore<StoreApi<HistoryState>> =
  create<HistoryState>()(
    persist(
      (set, get) => ({
        viewed: [],

        addViewed(threadId: string): void {
          set((state) => {
            const existingViewed = state.viewed.find((v) => v.id === threadId);
            const filtered = state.viewed.filter((v) => v.id !== threadId);
            const newViewed = [
              {
                id: threadId,
                ts: Date.now(),
                readReplyNumber:
                  existingViewed?.readReplyNumber ?? INITIAL_READ_REPLY_NUMBER,
              },
              ...filtered,
            ];
            return { viewed: newViewed.slice(0, MAX_VIEWED) };
          });
        },

        removeFromHistory(threadId: string): void {
          set((state) => ({
            viewed: state.viewed.filter((v) => v.id !== threadId),
          }));
        },

        clearHistory: () => set({ viewed: [] }),

        getViewedIds: () => get().viewed.map((v) => v.id),

        getReadReplyNumber(threadId: string): number | undefined {
          return get().viewed.find((x) => x.id === threadId)?.readReplyNumber;
        },

        recordReadReplyNumber(threadId: string, readReplyNumber: number): void {
          set((state) => ({
            // 指定のスレッドの既読レス数を記録する。増加のみ。
            // Post.seq の値をそのまま記録することを意図する。
            // 引数の readReplyNumber が記録値以下、または未閲覧スレなら何もしない。
            viewed: state.viewed.map((item) =>
              item.id === threadId
                ? {
                    ...item,
                    readReplyNumber: Math.max(
                      item.readReplyNumber,
                      readReplyNumber,
                    ),
                  }
                : item,
            ),
          }));
        },

        getUnreadCount(
          threadId: string,
          repliesCount: number,
        ): number | undefined {
          const readReplyNumber = get().getReadReplyNumber(threadId);
          if (readReplyNumber == null) {
            return undefined;
          } else {
            // 記録値は Post.seq の値そのままなので、それを踏まえて調整する。
            // 0以下はundefinedにする
            const unreadCount =
              repliesCount - (readReplyNumber - INITIAL_READ_REPLY_NUMBER);
            return unreadCount <= 0 ? undefined : unreadCount;
          }
        },
      }),
      {
        name: "aimg-history",
        version: 1,
        migrate: (persisted: unknown, version: number) => {
          if (version === 0) {
            // version 0 -> 1: ViewedItem.readReplyNumberを追加する
            // 旧データ構造では既読レス数を持たなかったので、「0レス既読」であるかのように移行する。
            type HistoryStateV0 = {
              viewed: { id: string; ts: number }[];
            };
            const oldState = persisted as HistoryStateV0;
            persisted = {
              ...oldState,
              viewed: oldState.viewed.map((item) => ({
                ...item,
                readReplyNumber: INITIAL_READ_REPLY_NUMBER,
              })),
            };
            version = 1;
          }

          return persisted;
        },
      },
    ),
  );
