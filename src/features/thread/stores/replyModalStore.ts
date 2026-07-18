import { create, type StoreApi, type UseBoundStore } from "zustand";
import { postNo } from "@/entities/post";

export interface ReplyModalState {
  isOpen: boolean;
  initialComment: string;
  openCount: number;
  open: (initialComment?: string) => void;
  close: () => void;
  reset: () => void;
}

export type ReplyQuoteType = "body" | "no" | "filename";

function attachmentFilename(url: string | undefined): string {
  if (!url) return "";
  const encoded = url.split("/").pop()?.split("?")[0] ?? "";
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export function createReplyInitialComment(
  post: {
    body: string;
    seq: number;
    boardNo: number | null;
    attachment?: { originalUrl: string } | null;
  },
  type: ReplyQuoteType,
): string {
  const quote =
    type === "filename"
      ? `>${attachmentFilename(post.attachment?.originalUrl)}`
      : type === "no"
        ? `>No.${postNo(post)}`
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
