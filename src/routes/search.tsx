import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@/pages/SearchPage";

export interface PublicSearchParams {
  q?: string;
}

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): PublicSearchParams => ({
    q: typeof search.q === "string" ? search.q.slice(0, 100) : "",
  }),
});
