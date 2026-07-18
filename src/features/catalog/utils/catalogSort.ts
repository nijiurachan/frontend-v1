import type { Thread } from "@/entities/thread";
import type {
  SortDirection,
  SortType,
} from "@/features/catalog/stores/catalogStore";

interface MobileSortPresentation {
  label: string;
  ariaLabel: string;
}

interface SortSelection {
  sort: SortType;
  direction: SortDirection;
}

const MOBILE_SORT_PRESENTATIONS: Record<
  SortType,
  Record<SortDirection, MobileSortPresentation>
> = {
  bump: {
    desc: {
      label: "カタ新▽",
      ariaLabel: "カタ新▽: カタログのbump新しい順",
    },
    asc: {
      label: "カタ古△",
      ariaLabel: "カタ古△: カタログのbump古い順",
    },
  },
  date: {
    desc: { label: "新順▽", ariaLabel: "新順▽: 日付の新しい順" },
    asc: { label: "古順△", ariaLabel: "古順△: 日付の古い順" },
  },
  replies: {
    desc: { label: "多順▽", ariaLabel: "多順▽: レス数の多い順" },
    asc: { label: "少順△", ariaLabel: "少順△: レス数の少ない順" },
  },
  sodane: {
    desc: {
      label: "そうだね多▽",
      ariaLabel: "そうだね多▽: そうだねの多い順",
    },
    asc: {
      label: "そうだね少△",
      ariaLabel: "そうだね少△: そうだねの少ない順",
    },
  },
};

export function getMobileSortPresentation(
  sort: SortType,
  direction: SortDirection,
): MobileSortPresentation {
  return MOBILE_SORT_PRESENTATIONS[sort][direction];
}

/** PC版が従来から提供する並び順だけへ、共有ストアの選択を正規化する。 */
export function getDesktopSortSelection(
  sort: SortType,
  direction: SortDirection,
): SortSelection {
  if (sort === "date") return { sort, direction };
  if (sort === "replies") return { sort, direction: "desc" };
  return { sort: "bump", direction: "desc" };
}

/**
 * 絞り込み後の表示対象を並べ替える。
 * catalog API は最大100件のため、反転とそうだね順は取得済み100件内だけに適用される。
 */
export function sortCatalogThreads(
  threads: Thread[],
  sort: SortType,
  direction: SortDirection,
): Thread[] {
  if (sort !== "sodane") {
    const sortedThreads = [...threads];
    return direction === "asc" ? sortedThreads.reverse() : sortedThreads;
  }

  return threads
    .map((thread, index) => ({ thread, index }))
    .sort((left, right) => {
      const difference =
        left.thread.opPost.sodaneCount - right.thread.opPost.sodaneCount;
      const directedDifference = direction === "asc" ? difference : -difference;
      return directedDifference || left.index - right.index;
    })
    .map(({ thread }) => thread);
}
