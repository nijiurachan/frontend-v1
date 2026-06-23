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

export function useCancelMine(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: (): Promise<void> => jukeboxClient.cancelMine(),
    onSuccess: (): void => {
      void queryClient.invalidateQueries({ queryKey: JUKEBOX_STATE_KEY });
    },
  });
}
