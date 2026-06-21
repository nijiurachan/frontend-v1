import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

interface ViewedItem {
  id: number;
  ts: number;
  readReplyNumber: number;
}

interface HistoryState {
  viewed: ViewedItem[];
  addViewed: (threadId: number) => void;
  removeFromHistory: (threadId: number) => void;
  clearHistory: () => void;
  getViewedIds: () => number[];
  getReadReplyNumber: (threadId: number) => number | undefined;
  recordReadReplyNumber: (threadId: number, readReplyNumber: number) => void;
  getUnreadCount: (
    threadId: number,
    repliesCount: number,
  ) => number | undefined;
}

const MAX_VIEWED = 100;
// 「0レス既読」を表すreadReplyNumberの値。現状Post.number_in_threadが1開始なので1である
const INITIAL_READ_REPLY_NUMBER = 1;

export const useHistoryStore: UseBoundStore<StoreApi<HistoryState>> =
  create<HistoryState>()(
    persist(
      (set, get) => ({
        viewed: [],

        addViewed(threadId: number): void {
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

        removeFromHistory(threadId: number): void {
          set((state) => ({
            viewed: state.viewed.filter((v) => v.id !== threadId),
          }));
        },

        clearHistory: () => set({ viewed: [] }),

        getViewedIds: () => get().viewed.map((v) => v.id),

        getReadReplyNumber(threadId: number): number | undefined {
          return get().viewed.find((x) => x.id === threadId)?.readReplyNumber;
        },

        recordReadReplyNumber(threadId: number, readReplyNumber: number): void {
          set((state) => ({
            // 指定のスレッドの既読レス数を記録する。増加のみ。
            // Post.number_in_threadの値をそのまま記録することを意図している(そのため見た目+1の値になる)
            // 引数のreadReplyNumberが記録されている値以下の場合、または、スレがviewedに入っていない場合は何もしない
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
          threadId: number,
          repliesCount: number,
        ): number | undefined {
          const readReplyNumber = get().getReadReplyNumber(threadId);
          // 記録されているreadReplyNumberの値はPost.number_in_threadの値そのままなので、それを踏まえて調整する
          // 0はundefinedにする
          return (
            (readReplyNumber &&
              repliesCount - (readReplyNumber - INITIAL_READ_REPLY_NUMBER)) ||
            undefined
          );
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
              viewed: { id: number; ts: number }[];
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
