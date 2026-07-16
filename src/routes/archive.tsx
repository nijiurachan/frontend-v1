import { createFileRoute } from "@tanstack/react-router";
import { ArchivePage } from "@/pages/ArchivePage";

export interface ArchiveSearch {
  page?: number;
}

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/archive")({
  component: ArchivePage,
  validateSearch: (search: Record<string, unknown>): ArchiveSearch => {
    const page = Number(search.page);
    return {
      page: Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1,
    };
  },
});
