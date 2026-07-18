import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Catalog } from "@/entities/thread";
import { getCatalogPath } from "@/features/catalog/hooks/catalogPath";
import { useCatalogStore } from "@/features/catalog/stores/catalogStore";
import { apiGet } from "@/shared/api";
import {
  runAimogeDataHook,
  useAimogeHookGeneration,
} from "@/shared/lib/aimoge";

export function useThreads(): UseQueryResult<Catalog> {
  const { currentSort } = useCatalogStore();
  const catalogPath = getCatalogPath(currentSort);
  const aimogeGeneration = useAimogeHookGeneration();
  const transformCatalog = useCallback(
    (catalog: Catalog): Catalog => {
      void aimogeGeneration;
      const transformedCatalog = runAimogeDataHook("data:catalog", catalog);
      return {
        ...transformedCatalog,
        threads: transformedCatalog.threads.map((thread) =>
          runAimogeDataHook("data:thread", thread),
        ),
      };
    },
    [aimogeGeneration],
  );

  const query = useQuery({
    queryKey: ["threads", catalogPath],
    queryFn: () => apiGet<Catalog>(catalogPath),
    select: transformCatalog,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return query;
}
