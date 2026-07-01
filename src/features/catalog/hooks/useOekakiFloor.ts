import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { floorOekakiThreads } from "../utils/floorOekakiThreads";

/**
 * そうだねが一定数以上のお絵描きスレをカタログの下半分に沈ませないよう並べ替える(カタログ専用)。
 * 優遇対象の判定(そうだね閾値ゲート)や並べ替えロジックは {@link floorOekakiThreads} を参照。
 */
export function useOekakiFloor(threads: Thread[]): Thread[] {
  return useMemo(() => floorOekakiThreads(threads), [threads]);
}
