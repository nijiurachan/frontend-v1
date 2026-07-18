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

export const CATALOG_AUTO_RELOAD_INTERVAL = 60_000;

export function getCatalogRefetchInterval(
  enabled: boolean,
  visibilityState: DocumentVisibilityState,
): number | false {
  return enabled && visibilityState === "visible"
    ? CATALOG_AUTO_RELOAD_INTERVAL
    : false;
}

export function useThreads(): UseQueryResult<Catalog> {
  const { currentSort, page, columns, rows, autoReload } = useCatalogStore();
  const limit = Math.max(1, Math.min(100, columns * rows));
  const catalogPath = getCatalogPath(currentSort, page, limit);
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
    refetchInterval: () =>
      getCatalogRefetchInterval(
        autoReload,
        typeof document === "undefined" ? "hidden" : document.visibilityState,
      ),
    refetchIntervalInBackground: false,
  });

  return query;
}
