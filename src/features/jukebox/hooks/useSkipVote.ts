// src/features/jukebox/hooks/useSkipVote.ts
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  JUKEBOX_STATE_KEY,
  jukeboxClient,
} from "@/features/jukebox/api/jukeboxClient";

export function useSkipVote(): UseMutationResult<
  { skipped: boolean },
  Error,
  void
> {
  const queryClient = useQueryClient();
  return useMutation<{ skipped: boolean }, Error, void>({
    mutationFn: (): Promise<{ skipped: boolean }> => jukeboxClient.skipVote(),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: JUKEBOX_STATE_KEY });
    },
  });
}
