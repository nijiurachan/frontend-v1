// src/features/jukebox/hooks/useCancelMine.ts
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  JUKEBOX_STATE_KEY,
  jukeboxClient,
} from "@/features/jukebox/api/jukeboxClient";

export function useCancelMine(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (trackId: number): Promise<void> =>
      jukeboxClient.cancelMine(trackId),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: JUKEBOX_STATE_KEY });
    },
  });
}
