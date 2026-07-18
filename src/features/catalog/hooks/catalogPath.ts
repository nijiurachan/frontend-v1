import type { SortType } from "@/features/catalog/stores/catalogStore";

export function getCatalogPath(
  sortType: SortType,
  page: number,
  limit: number,
): string {
  const normalizedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(100, Math.floor(limit)))
    : 100;
  return `/catalog?sort=${sortType}&page=${normalizedPage}&limit=${normalizedLimit}`;
}
