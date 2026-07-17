import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Catalog, TopPage } from "@/entities/thread";
import { apiGet } from "@/shared/api";
import {
  runAimogeDataHook,
  useAimogeHookGeneration,
} from "@/shared/lib/aimoge";
import { useCatalogStore } from "../stores/catalogStore";

export function useThreads(): UseQueryResult<Catalog> {
  const { currentSort } = useCatalogStore();
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
    queryKey: ["threads", currentSort],
    queryFn: async () => {
      if (currentSort === "default") {
        const top = await apiGet<TopPage>("/top");
        const catalog: Catalog = { sort: "bump", threads: top.threads };
        return catalog;
      }
      const sort: Catalog["sort"] =
        currentSort === "created"
          ? "new"
          : currentSort === "old"
            ? "old"
            : currentSort === "replies"
              ? "replies"
              : "bump";
      return apiGet<Catalog>(`/catalog?sort=${sort}`);
    },
    select: transformCatalog,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  return query;
}
