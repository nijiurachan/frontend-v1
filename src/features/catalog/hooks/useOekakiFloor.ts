import { useMemo } from "react";
import type { Thread } from "@/entities/thread";
import { floorOekakiThreads } from "../utils/floorOekakiThreads";

/**
 * お絵描きスレ(スレ画の is_oekaki)がカタログの下半分に沈まないように並べ替える(カタログ専用)。
 * 並べ替えロジックは {@link floorOekakiThreads} を参照。
 */
export function useOekakiFloor(threads: Thread[]): Thread[] {
  return useMemo(() => floorOekakiThreads(threads), [threads]);
}
