// src/features/jukebox/hooks/useHistory.ts
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  fetchHistory,
  JUKEBOX_HISTORY_KEY,
  type JukeboxHistoryItem,
} from "@/features/jukebox/api/jukeboxClient";

/** 直近24hの再生履歴。enabled=true（履歴パネルを開いた時）だけ取得する。 */
export function useHistory(
  enabled: boolean,
): UseQueryResult<JukeboxHistoryItem[], Error> {
  return useQuery<JukeboxHistoryItem[], Error>({
    queryKey: JUKEBOX_HISTORY_KEY,
    queryFn: fetchHistory,
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
