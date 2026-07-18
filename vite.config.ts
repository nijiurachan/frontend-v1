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
import { defineConfig, loadEnv } from "vite";
import { generateIndexTsUnplugin } from "./node_modules/@nijiurachan/js/src/build/plugins/generate-index-ts";
import { tscUnplugin } from "./node_modules/@nijiurachan/js/src/build/plugins/tsc";
import manifest from "./public/manifest.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig(({ mode, command }: ConfigEnv) => {
  const isBuild = command === "build";
  const isProd = mode === "production";
  const isDev = !isProd;
  const env = loadEnv(mode, import.meta.dirname, "");
  // VITE_BASE_PATH で配信ベースパスを上書きできる (空文字 "" = ルート直下配信)。
  // 未指定時は従来どおり production=/ts, testing=/ts-test, それ以外=/ts-dev。
  const basePath =
    env.VITE_BASE_PATH !== undefined
      ? env.VITE_BASE_PATH
      : isProd
        ? "/ts"
        : mode === "testing"
          ? "/ts-test"
          : "/ts-dev";
  const klecksEmbedUrl =
    env.VITE_KLECKS_EMBED_URL?.trim() || "/assets/klecks/embed.js";
  // ローカルAPI (AI_BBS) の起動アドレスが 8080 以外の場合に上書きできるようにする
  // (例: VS Code の auto port-forward が 8080 を占有している環境)
  const proxyTarget = env.VITE_PROXY_TARGET?.trim() || "http://localhost:8080";

  return {
    build: {
      assetsDir: join(".", basePath, "assets"),
      sourcemap: true,
      rolldownOptions: {
        input: ["index.html", "src/oekaki.ts", "src/klecks.ts"],
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
      addImportMap(klecksEmbedUrl),
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
      alias: [
        {
          find: "react-dom/client",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/client.mjs",
          ),
        },
        {
          find: "react-dom",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/dist/compat.module.js",
          ),
        },
        {
          find: "react/jsx-dev-runtime",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/jsx-dev-runtime.mjs",
          ),
        },
        {
          find: "react/jsx-runtime",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/jsx-runtime.mjs",
          ),
        },
        {
          find: "react",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/dist/compat.module.js",
          ),
        },
        {
          find: "preact/compat",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/compat/dist/compat.module.js",
          ),
        },
        {
          find: "preact/hooks",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/hooks/dist/hooks.module.js",
          ),
        },
        {
          find: "preact/jsx-dev-runtime",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js",
          ),
        },
        {
          find: "preact/jsx-runtime",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js",
          ),
        },
        {
          find: "preact",
          replacement: resolve(
            import.meta.dirname,
            "./node_modules/preact/dist/preact.module.js",
          ),
        },
        { find: "@", replacement: resolve(import.meta.dirname, "./src") },
      ],
      dedupe: [
        "preact",
        "preact/hooks",
        "preact/jsx-dev-runtime",
        "preact/jsx-runtime",
      ],
    },
    define: {
      // ルート直下配信 (basePath="") のときは Router へ "/" を渡す
      "import.meta.env.BASE_PATH": JSON.stringify(basePath || "/"),
      "import.meta.env.APP_NAME": JSON.stringify(manifest.name),
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  } satisfies UserConfig;
});

/** index.htmlにお絵描きポップアップに必要なimportmapを足す */
function addImportMap(klecksEmbedUrl: string): Plugin {
  return {
    name: "import-map-maker",
    transformIndexHtml(
      _src: string,
      cxt: IndexHtmlTransformContext,
    ): HtmlTagDescriptor[] {
      const importmap = makeImportMap(cxt, klecksEmbedUrl);

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
function makeImportMap(
  cxt: IndexHtmlTransformContext,
  klecksEmbedUrl: string,
): ImportMap {
  return {
    imports: {
      "#oekaki": makeEntryChunkPath(cxt, "oekaki", "src/oekaki.ts"),
      "#klecks": makeEntryChunkPath(cxt, "klecks", "src/klecks.ts"),
      "#klecks-embed": klecksEmbedUrl,
    },
  };
}

/** importmapに載せるentryの出力先を探す */
function makeEntryChunkPath(
  cxt: IndexHtmlTransformContext,
  entryName: string,
  sourcePath: string,
): string {
  const chunk = Object.values(cxt.bundle ?? {}).find(
    (c) => c.type === "chunk" && c.isEntry && c.name === entryName,
  );

  if (cxt.bundle && !chunk) {
    throw Error(
      `${sourcePath}が見つかりませんでした。ファイル名が変わっているようです`,
    );
  }

  return `/${chunk?.fileName ?? sourcePath}`;
}
