import { join, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import ssl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import type {
  ConfigEnv,
  HtmlTagDescriptor,
  IndexHtmlTransformContext,
  Plugin,
  UserConfig,
} from "vite";
import { defineConfig } from "vite";
import { generateIndexTsUnplugin } from "./node_modules/@nijiurachan/js/src/build/plugins/generate-index-ts";
import { tscUnplugin } from "./node_modules/@nijiurachan/js/src/build/plugins/tsc";
import manifest from "./public/manifest.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig(({ mode, command }: ConfigEnv) => {
  const isBuild = command === "build";
  const isProd = mode === "production";
  const isDev = !isProd;
  const basePath = isProd ? "/ts" : "/ts-dev";

  return {
    build: {
      assetsDir: join(".", basePath, "assets"),
      sourcemap: true,
      rolldownOptions: {
        input: ["index.html", "src/oekaki.ts"],
        output: {
          externalLiveBindings: false,
        },
      },
    },
    plugins: [
      // 並び替えると動かなくなったりするのでご注意ください
      isDev && ssl(),
      tanstackRouter(),
      react(),
      tailwindcss(),
      addImportMap(),
      generateIndexTsUnplugin.vite({
        dir: "src",
        excludePatterns: [
          "**/index.ts",
          "**/*.test.ts",
          "**/*.test.tsx",
          "src/*.*",
          "src/{app,pages,routes}/**/*",
        ],
      }) as Plugin,
      isBuild &&
        (tscUnplugin.vite({
          dir: import.meta.dirname,
        }) as Plugin),
    ],
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.BASE_PATH": JSON.stringify(basePath),
      "import.meta.env.APP_NAME": JSON.stringify(manifest.name),
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
        "/uploads": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
  } satisfies UserConfig;
});

/** index.htmlにお絵描きポップアップに必要なimportmapを足す */
function addImportMap(): Plugin {
  return {
    name: "import-map-maker",
    transformIndexHtml(
      _src: string,
      cxt: IndexHtmlTransformContext,
    ): HtmlTagDescriptor[] {
      const importmap = makeImportMap(cxt);

      return [
        {
          tag: "script",
          attrs: { type: "importmap" },
          children: JSON.stringify(importmap),
        },
      ];
    },
  };
}

type ImportMap = {
  imports: Record<string, string>;
};

/** importmapを作る */
function makeImportMap(cxt: IndexHtmlTransformContext): ImportMap {
  return {
    imports: {
      "#oekaki": makeOekakiChunkPath(cxt),
    },
  };
}

/** importmapに載せるoekaki.tsの出力先を探す */
function makeOekakiChunkPath(cxt: IndexHtmlTransformContext): string {
  const oekakiChunk = Object.values(cxt.bundle ?? {}).find(
    (c) => c.type === "chunk" && c.isEntry && c.name === "oekaki",
  );

  if (cxt.bundle && !oekakiChunk) {
    throw Error(
      "oekaki.tsが見つかりませんでした。ファイル名が変わっているようです",
    );
  }

  return `/${oekakiChunk?.fileName ?? "src/oekaki.ts"}`;
}
