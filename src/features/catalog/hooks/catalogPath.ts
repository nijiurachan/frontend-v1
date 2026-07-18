import type { SortType } from "@/features/catalog/stores/catalogStore";

export function getCatalogPath(sortType: SortType): string {
  const sort =
    sortType === "date" ? "new" : sortType === "replies" ? "replies" : "bump";
  return `/catalog?sort=${sort}`;
}
