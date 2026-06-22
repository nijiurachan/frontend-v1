// src/features/jukebox/hooks/useEnqueue.ts
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { JUKEBOX_STATE_KEY, jukeboxClient } from "../api/jukeboxClient";

export function useEnqueue(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (url: string): Promise<void> => jukeboxClient.enqueue(url),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: JUKEBOX_STATE_KEY });
    },
  });
}
