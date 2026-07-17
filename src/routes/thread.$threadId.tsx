import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export interface ThreadSearch {
  archivedAt?: string;
}

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/thread/$threadId")({
  component: lazyRouteComponent(
    () => import("@/pages/ThreadPage"),
    "ThreadPage",
  ),
  validateSearch: (search: Record<string, unknown>): ThreadSearch => {
    const archivedAt = search.archivedAt;
    return {
      ...(typeof archivedAt === "string" && archivedAt ? { archivedAt } : {}),
    };
  },
});
