import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { migrateThreadIdArray } from "@/shared/lib/threadIdMigration";

export const CATALOG_SORTS = [
  "bump",
  "new",
  "old",
  "replies",
  "momentum",
  "soudane",
] as const;
export type SortType = (typeof CATALOG_SORTS)[number];
export type SortDirection = "asc" | "desc";
export type AnimSetting = "always" | "hover" | "never";
export type CatalogTextPosition = "below" | "right";
export type CatalogImageSize = 50 | 75 | 100 | 125 | 150 | 175 | 200;

export type ThreadMenuOpenMethod =
  | "auto"
  | "long-press"
  | "menu-button"
  | "off";

interface CatalogValues {
  currentSort: SortType;
  /** v2永続データとの互換用。server sortはcurrentSortだけで決まる */
  sortDirection: SortDirection;
  page: number;
  columns: number;
  rows: number;
  textLength: number;
  textPosition: CatalogTextPosition;
  imageSize: CatalogImageSize;
  openInNewTab: boolean;
  showNew: boolean;
  showCount: boolean;
  showUnreadCount: boolean;
  catalogAnim: AnimSetting;
  autoReload: boolean;
  threadMenuOpenMethod: ThreadMenuOpenMethod;
  lastCatalogIds: string[];
  searchQuery: string;
  selectedTag: string | null;
}

interface CatalogActions {
  setSort: (sort: SortType, direction?: SortDirection) => void;
  selectSort: (sort: SortType) => void;
  setPage: (page: number) => void;
  setColumns: (columns: number) => void;
  setRows: (rows: number) => void;
  setTextLength: (length: number) => void;
  setTextPosition: (position: CatalogTextPosition) => void;
  setImageSize: (size: CatalogImageSize) => void;
  setOpenInNewTab: (open: boolean) => void;
  setShowNew: (show: boolean) => void;
  setShowCount: (show: boolean) => void;
  setShowUnreadCount: (show: boolean) => void;
  setCatalogAnim: (anim: AnimSetting) => void;
  setAutoReload: (enabled: boolean) => void;
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
  page: 1,
  columns: 7,
  rows: 8,
  textLength: 8,
  textPosition: "below",
  imageSize: 100,
  openInNewTab: true,
  showNew: true,
  showCount: true,
  showUnreadCount: true,
  catalogAnim: "always",
  autoReload: false,
  threadMenuOpenMethod: "auto",
  lastCatalogIds: [],
  searchQuery: "",
  selectedTag: null,
};

export function getCatalogPageLimit(columns: number, rows: number): number {
  return Math.max(1, Math.min(100, Math.floor(columns) * Math.floor(rows)));
}

export const useCatalogStore: UseBoundStore<StoreApi<CatalogState>> =
  create<CatalogState>()(
    persist(
      (set) => ({
        ...DEFAULT_CATALOG_VALUES,
        setSort: (currentSort: SortType) =>
          set({ currentSort, sortDirection: "desc", page: 1 }),
        selectSort: (currentSort: SortType) =>
          set({ currentSort, sortDirection: "desc", page: 1 }),
        setPage: (page: number) => set({ page: Math.max(1, Math.floor(page)) }),
        setColumns: (columns: number) =>
          set({ columns: clampInteger(columns, 1, 12), page: 1 }),
        setRows: (rows: number) =>
          set({ rows: clampInteger(rows, 1, 20), page: 1 }),
        setTextLength: (textLength: number) =>
          set({ textLength: clampInteger(textLength, 0, 200) }),
        setTextPosition: (textPosition: CatalogTextPosition) =>
          set({ textPosition }),
        setImageSize: (imageSize: CatalogImageSize) => set({ imageSize }),
        setOpenInNewTab: (openInNewTab: boolean) => set({ openInNewTab }),
        setShowNew: (showNew: boolean) => set({ showNew }),
        setShowCount: (showCount: boolean) => set({ showCount }),
        setShowUnreadCount: (showUnreadCount: boolean) =>
          set({ showUnreadCount }),
        setCatalogAnim: (catalogAnim: AnimSetting) => set({ catalogAnim }),
        setAutoReload: (autoReload: boolean) => set({ autoReload }),
        setThreadMenuOpenMethod: (threadMenuOpenMethod: ThreadMenuOpenMethod) =>
          set({ threadMenuOpenMethod }),
        updateLastCatalogIds: (lastCatalogIds: string[]) =>
          set({ lastCatalogIds }),
        setSearchQuery: (searchQuery: string) => set({ searchQuery, page: 1 }),
        setSelectedTag: (selectedTag: string | null) =>
          set({ selectedTag, page: 1 }),
        resetCatalogSettings: () => set({ ...DEFAULT_CATALOG_VALUES }),
      }),
      {
        name: "aimg-catalog-settings",
        version: 3,
        migrate: migrateCatalogState,
        partialize: (state: CatalogState) => ({
          currentSort: state.currentSort,
          sortDirection: state.sortDirection,
          columns: state.columns,
          rows: state.rows,
          textLength: state.textLength,
          textPosition: state.textPosition,
          imageSize: state.imageSize,
          openInNewTab: state.openInNewTab,
          showNew: state.showNew,
          showCount: state.showCount,
          showUnreadCount: state.showUnreadCount,
          catalogAnim: state.catalogAnim,
          autoReload: state.autoReload,
          threadMenuOpenMethod: state.threadMenuOpenMethod,
          lastCatalogIds: state.lastCatalogIds,
        }),
      },
    ),
  );

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
  if (!isRecord(migrated)) return migrated;

  const direction = migrated.sortDirection === "asc" ? "asc" : "desc";
  const currentSort = normalizePersistedSort(migrated.currentSort, direction);
  return {
    ...migrated,
    currentSort,
    sortDirection: "desc",
    page: 1,
  };
}

function normalizePersistedSort(
  value: unknown,
  direction: SortDirection,
): SortType {
  if (value === "date" || value === "created") {
    return direction === "asc" ? "old" : "new";
  }
  if (value === "sodane") return "soudane";
  if (value === "default" || value === "recent") return "bump";
  return CATALOG_SORTS.find((sort) => sort === value) ?? "bump";
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
