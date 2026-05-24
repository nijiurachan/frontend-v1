import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/thread/$threadId")({
  component: lazyRouteComponent(
    () => import("@/pages/ThreadPage"),
    "ThreadPage",
  ),
});
