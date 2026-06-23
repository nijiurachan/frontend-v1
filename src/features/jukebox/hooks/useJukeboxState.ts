// src/features/jukebox/hooks/useJukeboxState.ts
import type { JukeboxState } from "@nijiurachan/js/pure/jukebox";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  JUKEBOX_STATE_KEY,
  jukeboxClient,
} from "@/features/jukebox/api/jukeboxClient";

export function useJukeboxState(): UseQueryResult<JukeboxState, Error> {
  return useQuery<JukeboxState, Error>({
    queryKey: JUKEBOX_STATE_KEY,
    queryFn: (): Promise<JukeboxState> => jukeboxClient.getState(),
    refetchInterval: 3_000,
    staleTime: 0,
  });
}
