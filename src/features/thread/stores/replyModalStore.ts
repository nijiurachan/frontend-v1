import { create, type StoreApi, type UseBoundStore } from "zustand";

interface ReplyModalState {
  isOpen: boolean;
  initialComment: string;
  openCount: number;
  open: (initialComment?: string) => void;
  close: () => void;
  reset: () => void;
}

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
