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

interface CatalogValues {
  currentSort: SortType;
  columns: number;
  showNew: boolean;
  showCount: boolean;
  catalogAnim: AnimSetting;
  lastCatalogIds: number[];
  searchQuery: string;
}

interface CatalogActions {
  setSort: (sort: SortType) => void;
  setColumns: (columns: number) => void;
  setShowNew: (show: boolean) => void;
  setShowCount: (show: boolean) => void;
  setCatalogAnim: (anim: AnimSetting) => void;
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
  catalogAnim: "always",
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
        setCatalogAnim: (anim: AnimSetting) => set({ catalogAnim: anim }),
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
          catalogAnim: state.catalogAnim,
          lastCatalogIds: state.lastCatalogIds,
        }),
      },
    ),
  );
