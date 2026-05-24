import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/pages/CatalogPage";

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/")({
  component: CatalogPage,
});
