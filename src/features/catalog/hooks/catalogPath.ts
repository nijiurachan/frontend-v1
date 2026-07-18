import type { SortType } from "@/features/catalog/stores/catalogStore";

export function getCatalogPath(sortType: SortType): string {
  const sort =
    sortType === "created"
      ? "new"
      : sortType === "old"
        ? "old"
        : sortType === "replies"
          ? "replies"
          : "bump";
  return `/catalog?sort=${sort}`;
}
