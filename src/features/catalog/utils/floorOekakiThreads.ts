import type { Thread } from "@/entities/thread";

/**
 * お絵描きスレ(スレ画の is_oekaki が true)がカタログの下半分に沈まないように並べ替える。
 *
 * 中間ライン(先頭から ceil(n/2) 件)より下に落ちたお絵描きスレだけを中間ライン直前へ
 * 引き上げ、それ以外の並び(サーバーソート順)は可能な限り保持する。お絵描きスレが上半分の
 * 枠を超える場合は、上半分をソート順のお絵描きで埋め、あふれた分を中間ライン直下へ続けて
 * 並べる(通常スレは最下部へ)。
 *
 * 添付のないスレ(画像なし)は通常スレ扱いとする。
 */
export function floorOekakiThreads(threads: Thread[]): Thread[] {
  const n = threads.length;
  if (n < 2) return threads;

  const oekaki: Thread[] = [];
  const others: Thread[] = [];
  for (const thread of threads) {
    if (thread.attachment?.is_oekaki ?? false) {
      oekaki.push(thread);
    } else {
      others.push(thread);
    }
  }
  if (oekaki.length === 0) return threads;

  // 上半分の枠数。お絵描きスレはこの範囲(先頭から topCount 件)に収める。
  const topCount = Math.ceil(n / 2);
  const topOekakiCount = Math.min(oekaki.length, topCount);
  const fillCount = Math.max(0, topCount - oekaki.length);

  // 上半分に入れるスレの id 集合。お絵描き(あふれ分を除く)＋枠を埋める先頭の通常スレ。
  // Thread オブジェクトの参照同一性ではなく id(一意)で判定し、上流がスレを複製しても壊れないようにする。
  const topMemberIds = new Set<number>();
  for (let i = 0; i < topOekakiCount; i++) topMemberIds.add(oekaki[i].id);
  for (let i = 0; i < fillCount; i++) topMemberIds.add(others[i].id);

  // 上半分は元の並び順を維持(据え置き・引き上げの最小限の入れ替えになる)。
  const topBand = threads.filter((thread) => topMemberIds.has(thread.id));
  // 下半分はあふれたお絵描きを先頭に、続けて残りの通常スレ(いずれも元の並び順)。
  const bottomBand = [
    ...oekaki.slice(topOekakiCount),
    ...others.slice(fillCount),
  ];

  return [...topBand, ...bottomBand];
}
