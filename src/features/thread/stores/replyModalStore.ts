import { create, type StoreApi, type UseBoundStore } from "zustand";

export interface ReplyModalState {
  isOpen: boolean;
  initialComment: string;
  openCount: number;
  open: (initialComment?: string) => void;
  close: () => void;
  reset: () => void;
}

export type ReplyQuoteType = "body" | "no";

export function createReplyInitialComment(
  post: { body: string; seq: number },
  type: ReplyQuoteType,
): string {
  const quote =
    type === "no"
      ? `>No.${post.seq}`
      : post.body
          .split(/\r?\n/)
          .map((line) => `>${line}`)
          .join("\n");
  return `${quote}\n`;
}

export const selectReplyInitialComment = (state: ReplyModalState): string =>
  state.initialComment;

export const selectReplyOpenCount = (state: ReplyModalState): number =>
  state.openCount;

export const useReplyModalStore: UseBoundStore<StoreApi<ReplyModalState>> =
  create<ReplyModalState>((set) => ({
    isOpen: false,
    initialComment: "",
    openCount: 0,
    open: (initialComment?: string) =>
      set((s) => ({
        isOpen: true,
        initialComment: initialComment ?? "",
        openCount: s.openCount + 1,
      })),
    close: () => set({ isOpen: false }),
    reset: () => set({ isOpen: false, initialComment: "", openCount: 0 }),
  }));
