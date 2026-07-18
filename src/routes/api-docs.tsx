import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { getApiUiUrl } from "@/shared/lib/apiDocsUrl";

const ApiDocsRedirect: React.FunctionComponent = () => {
  useEffect(() => {
    window.location.replace(getApiUiUrl());
  }, []);

  return null;
};

// biome-ignore lint/nursery/useExplicitType: 型が長く書き出してもメリットが薄い
export const Route = createFileRoute("/api-docs")({
  component: ApiDocsRedirect,
});
