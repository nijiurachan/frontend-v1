import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { migrateThreadIdArray } from "@/shared/lib/threadIdMigration";

export type SortType = "bump" | "date" | "replies" | "sodane";

export type SortDirection = "asc" | "desc";

interface SortSelection {
  sort: SortType;
  direction: SortDirection;
}

export type AnimSetting = "always" | "never";

export type ThreadMenuOpenMethod =
  | "auto"
  | "long-press"
  | "menu-button"
  | "off";

interface CatalogValues {
  currentSort: SortType;
  sortDirection: SortDirection;
  columns: number;
  showNew: boolean;
  showCount: boolean;
  showUnreadCount: boolean;
  catalogAnim: AnimSetting;
  threadMenuOpenMethod: ThreadMenuOpenMethod;
  lastCatalogIds: string[];
  searchQuery: string;
  selectedTag: string | null;
}

interface CatalogActions {
  setSort: (sort: SortType, direction: SortDirection) => void;
  selectSort: (sort: SortType) => void;
  setColumns: (columns: number) => void;
  setShowNew: (show: boolean) => void;
  setShowCount: (show: boolean) => void;
  setShowUnreadCount: (show: boolean) => void;
  setCatalogAnim: (anim: AnimSetting) => void;
  setThreadMenuOpenMethod: (method: ThreadMenuOpenMethod) => void;
  updateLastCatalogIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  resetCatalogSettings: () => void;
}

type CatalogState = CatalogValues & CatalogActions;

const DEFAULT_CATALOG_VALUES: CatalogValues = {
  currentSort: "bump",
  sortDirection: "desc",
  columns: 4,
  showNew: true,
  showCount: true,
  showUnreadCount: true,
  catalogAnim: "always",
  threadMenuOpenMethod: "auto",
  lastCatalogIds: [],
  searchQuery: "",
  selectedTag: null,
};

export const useCatalogStore: UseBoundStore<StoreApi<CatalogState>> =
  create<CatalogState>()(
    persist(
      (set) => ({
        ...DEFAULT_CATALOG_VALUES,

        setSort: (sort: SortType, direction: SortDirection) =>
          set({ currentSort: sort, sortDirection: direction }),
        selectSort: (sort: SortType) =>
          set((state) => {
            const selection = getNextSortSelection(
              state.currentSort,
              state.sortDirection,
              sort,
            );
            return {
              currentSort: selection.sort,
              sortDirection: selection.direction,
            };
          }),
        setColumns: (columns: number) => set({ columns }),
        setShowNew: (show: boolean) => set({ showNew: show }),
        setShowCount: (show: boolean) => set({ showCount: show }),
        setShowUnreadCount: (show: boolean) => set({ showUnreadCount: show }),
        setCatalogAnim: (anim: AnimSetting) => set({ catalogAnim: anim }),
        setThreadMenuOpenMethod: (method: ThreadMenuOpenMethod) =>
          set({ threadMenuOpenMethod: method }),
        updateLastCatalogIds: (ids: string[]) => set({ lastCatalogIds: ids }),
        setSearchQuery: (query: string) => set({ searchQuery: query }),
        setSelectedTag: (selectedTag: string | null) => set({ selectedTag }),
        resetCatalogSettings: () => set({ ...DEFAULT_CATALOG_VALUES }),
      }),
      {
        name: "aimg-catalog-settings",
        version: 2,
        migrate: migrateCatalogState,
        partialize: (state: CatalogState) => ({
          currentSort: state.currentSort,
          sortDirection: state.sortDirection,
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

export function getNextSortSelection(
  currentSort: SortType,
  currentDirection: SortDirection,
  selectedSort: SortType,
): SortSelection {
  if (currentSort !== selectedSort) {
    return { sort: selectedSort, direction: "desc" };
  }

  return {
    sort: currentSort,
    direction: currentDirection === "desc" ? "asc" : "desc",
  };
}

export function migrateCatalogState(
  persisted: unknown,
  version: number,
): unknown {
  const migrated = migrateThreadIdArray(
    persisted,
    version,
    1,
    "lastCatalogIds",
  );
  if (version >= 2 || !isRecord(migrated)) return migrated;

  const direction = isSortDirection(migrated.sortDirection)
    ? migrated.sortDirection
    : "desc";

  switch (migrated.currentSort) {
    case "old":
      return { ...migrated, currentSort: "date", sortDirection: "asc" };
    case "created":
      return { ...migrated, currentSort: "date", sortDirection: direction };
    case "default":
      return { ...migrated, currentSort: "bump", sortDirection: direction };
    case "soudane":
      return { ...migrated, currentSort: "sodane", sortDirection: direction };
    case "bump":
    case "date":
    case "replies":
    case "sodane":
      return { ...migrated, sortDirection: direction };
    default:
      return { ...migrated, currentSort: "bump", sortDirection: "desc" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc";
}
