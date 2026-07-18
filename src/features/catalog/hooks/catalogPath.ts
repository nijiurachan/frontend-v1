import type {
  SortDirection,
  SortType,
} from "@/features/catalog/stores/catalogStore";
import { getDesktopSortSelection } from "@/features/catalog/utils/catalogSort";

export type CatalogLayout = "mobile" | "desktop";

export function getCatalogPath(
  sortType: SortType,
  direction: SortDirection = "desc",
  layout: CatalogLayout = "mobile",
): string {
  const selection =
    layout === "desktop"
      ? getDesktopSortSelection(sortType, direction)
      : { sort: sortType, direction };
  const sort =
    selection.sort === "date"
      ? layout === "desktop" && selection.direction === "asc"
        ? "old"
        : "new"
      : selection.sort === "replies"
        ? "replies"
        : "bump";
  return `/catalog?sort=${sort}`;
}
