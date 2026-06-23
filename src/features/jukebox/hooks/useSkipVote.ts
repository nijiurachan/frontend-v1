// src/features/jukebox/hooks/useSkipVote.ts
import type { JukeboxVoteResult } from "@nijiurachan/js/io/jukebox-api";
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { JUKEBOX_STATE_KEY, vote } from "@/features/jukebox/api/jukeboxClient";

/**
 * 指定トラックへの除外/スキップ投票をトグルするミューテーション。
 * trackId（キュー項目 / 再生中曲の id）を受け取り、成功時に jukebox state を再取得する。
 */
export function useSkipVote(): UseMutationResult<
  JukeboxVoteResult,
  Error,
  number
> {
  const queryClient = useQueryClient();
  return useMutation<JukeboxVoteResult, Error, number>({
    mutationFn: (trackId: number): Promise<JukeboxVoteResult> => vote(trackId),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: JUKEBOX_STATE_KEY });
    },
  });
}
