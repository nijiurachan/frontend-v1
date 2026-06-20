import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

export type SortType =
  | "default"
  | "created"
  | "old"
  | "replies"
  | "momentum"
  | "soudane";

export type AnimSetting = "always" | "never";

export type ThreadMenuOpenMethod =
  | "auto"
  | "long-press"
  | "menu-button"
  | "off";

interface CatalogValues {
  currentSort: SortType;
  columns: number;
  showNew: boolean;
  showCount: boolean;
  showUnreadCount: boolean;
  catalogAnim: AnimSetting;
  threadMenuOpenMethod: ThreadMenuOpenMethod;
  lastCatalogIds: number[];
  searchQuery: string;
}

interface CatalogActions {
  setSort: (sort: SortType) => void;
  setColumns: (columns: number) => void;
  setShowNew: (show: boolean) => void;
  setShowCount: (show: boolean) => void;
  setShowUnreadCount: (show: boolean) => void;
  setCatalogAnim: (anim: AnimSetting) => void;
  setThreadMenuOpenMethod: (method: ThreadMenuOpenMethod) => void;
  updateLastCatalogIds: (ids: number[]) => void;
  setSearchQuery: (query: string) => void;
  resetCatalogSettings: () => void;
}

type CatalogState = CatalogValues & CatalogActions;

const DEFAULT_CATALOG_VALUES: CatalogValues = {
  currentSort: "default",
  columns: 4,
  showNew: true,
  showCount: true,
  showUnreadCount: true,
  catalogAnim: "always",
  threadMenuOpenMethod: "auto",
  lastCatalogIds: [],
  searchQuery: "",
};

export const useCatalogStore: UseBoundStore<StoreApi<CatalogState>> =
  create<CatalogState>()(
    persist(
      (set) => ({
        ...DEFAULT_CATALOG_VALUES,

        setSort: (sort: SortType) => set({ currentSort: sort }),
        setColumns: (columns: number) => set({ columns }),
        setShowNew: (show: boolean) => set({ showNew: show }),
        setShowCount: (show: boolean) => set({ showCount: show }),
        setShowUnreadCount: (show: boolean) => set({ showUnreadCount: show }),
        setCatalogAnim: (anim: AnimSetting) => set({ catalogAnim: anim }),
        setThreadMenuOpenMethod: (method: ThreadMenuOpenMethod) =>
          set({ threadMenuOpenMethod: method }),
        updateLastCatalogIds: (ids: number[]) => set({ lastCatalogIds: ids }),
        setSearchQuery: (query: string) => set({ searchQuery: query }),
        resetCatalogSettings: () => set({ ...DEFAULT_CATALOG_VALUES }),
      }),
      {
        name: "aimg-catalog-settings",
        partialize: (state: CatalogState) => ({
          currentSort: state.currentSort,
          columns: state.columns,
          showNew: state.showNew,
          showCount: state.showCount,
          showUnreadCount: state.showUnreadCount,
          catalogAnim: state.catalogAnim,
          threadMenuOpenMethod: state.threadMenuOpenMethod,
          lastCatalogIds: state.lastCatalogIds,
        }),
      },
    ),
  );
