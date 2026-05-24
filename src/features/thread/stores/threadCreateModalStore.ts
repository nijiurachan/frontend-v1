import { create, type StoreApi, type UseBoundStore } from "zustand";

interface ThreadCreateModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useThreadCreateModalStore: UseBoundStore<
  StoreApi<ThreadCreateModalState>
> = create<ThreadCreateModalState>((set) => ({
  isOpen: false,
  open: (): void => set({ isOpen: true }),
  close: (): void => set({ isOpen: false }),
}));
