import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export interface GallerySearch {
  start?: number;
}

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/gallery/$threadId")({
  component: lazyRouteComponent(
    () => import("@/pages/GalleryPage"),
    "GalleryPage",
  ),
  validateSearch: (search: Record<string, unknown>): GallerySearch => ({
    start: Number(search.start) || 0,
  }),
});
