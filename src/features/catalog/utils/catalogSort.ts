import type { SortType } from "@/features/catalog/stores/catalogStore";

interface SortPresentation {
  label: string;
  ariaLabel: string;
}

const SORT_PRESENTATIONS: Record<SortType, SortPresentation> = {
  bump: { label: "カタ", ariaLabel: "bump順" },
  new: { label: "新順", ariaLabel: "作成日時の新しい順" },
  old: { label: "古順", ariaLabel: "作成日時の古い順" },
  replies: { label: "多順", ariaLabel: "レス数の多い順" },
  momentum: { label: "勢順", ariaLabel: "勢いの高い順" },
  soudane: { label: "そ順", ariaLabel: "そうだねの多い順" },
};

export function getSortPresentation(sort: SortType): SortPresentation {
  return SORT_PRESENTATIONS[sort];
}

/** v2以前の呼び出し元向け。全sortがserver global sortとしてそのまま通る。 */
export function getDesktopSortSelection(sort: SortType): {
  sort: SortType;
  direction: "desc";
} {
  return { sort, direction: "desc" };
}
