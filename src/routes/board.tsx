import { createFileRoute } from "@tanstack/react-router";
import { BoardPage } from "@/pages/BoardPage";

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/board")({
  component: BoardPage,
});
