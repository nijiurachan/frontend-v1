# Klecks を AXNOS Paint と完全並列にする

## Context（なぜやるか）

Klecks は最近 axnos と並べて雑にぶち込まれたため、以下 3 点で axnos と非対称になっています。

1. **配布経路が違う** — axnos の本体 JS は npm パッケージ `axnospaint-for-aimg`（node_modules）から `import` されて Vite が oekaki チャンクにバンドル。対して Klecks の埋め込みアセット（`embed.js` + 主 CSS + 153 個の同梱アセット、計 154 ファイル）は frontend-v1 の `public/assets/klecks/` に**ビルド済みバンドルのまま**直コミット。importmap `#klecks-embed` と env `VITE_KLECKS_EMBED_URL`、Cloudflare Worker route `/assets/klecks/*` まで公開資産扱いで露出しています。
2. **お絵描きフラグが立たない** — バックエンド `PostController::parseUpload` は `image/{png,webp}+{oekaki,oekaki98}` の 4 種のみ判定。Klecks は `@nijiurachan/js` の `resolvePaintPopup()` が `fileTool: "klecks"` を返すため `image/png+klecks` が付き、4 種のどれにも当たらず `is_oekaki=false`。axnos とはっちゃんキャンバスは既に `+oekaki` / `+oekaki98` が付いています。
3. **遅延ロードの確証がない** — Klecks embed バンドルは巨大なので初回ポップアップまで一切ネットワークが走らないことを保証したい。

追加で判明した状況:
- Klecks のソース本体は既に `nijiurachan/klecks`（upstream）に存在し、`ebine-lab/klecks` がフォーク済み。
- **frontend-v1 の `public/assets/klecks/**` は upstream Klecks を単純ビルドしたものではなく、チューンナップ済みバンドル**。例として「お手書きに反する画像貼り付け機能の切除」等が入っている（frontend-v1 側でパッチしたビルド出力）。
- 望ましいのはチューンナップ後の挙動。従ってこれを `ebine-lab/klecks` のソースにバックポートし、そこからビルドしたものを配布する。

目的: Klecks を axnos と同トポロジ（node_modules パッケージ由来 + `+oekaki` サフィックス + 起動時ゼロコスト）にし、かつ現在の frontend-v1 版のチューンナップを ebine-lab/klecks ソースに反映する。バックエンドは無変更。

## Approach

### 1) `ebine-lab/klecks` のソースにチューンナップをバックポート

現在 `public/assets/klecks/` に置いてある**ビルド出力**は minified なので直接パッチをリバースするのは不毛。「セマンティックにどこを削ったか」を特定してソース側で同等改変する。

**特定手順**（frontend-v1 リポジトリと `ebine-lab/klecks` のクローンを併読）:
1. `public/assets/klecks/embed.js` に対する historical commit を frontend-v1 の `git log -- public/assets/klecks/embed.js` で洗い出す。コミットメッセージ・関連 PR に「画像貼り付け」「paste」「切除」「削除」などの説明が残っているはず。
2. 該当コミットが upstream の Klecks コードのどの領域を触ったかを特定（コミットメッセージや PR 本文が付いていない場合は、`ebine-lab/klecks` を試しビルドして生成 embed.js を diff → 削られている箇所から逆引き）。
3. `ebine-lab/klecks` のソース側に恒久的に同じ改変を入れる。主眼はまず「画像貼り付け（paste import）」機能の切除。他に候補があれば同じ手順で拾う（例: フィルタ・スタンプなど「絵を借用してくる系」の機能があれば同様に検討）。
4. `ebine-lab/klecks` 側で単体テスト・E2E があれば通す。無ければ手で開いて（下記 Verification）paste UI が消えていること、既存の描画ワークフローが壊れていないことを確認。

**運用**: 当面は `ebine-lab/klecks#<sha>` を pin して配布。落ち着いたら upstream `nijiurachan/klecks` へ PR を出し、マージ後に `nijiurachan/klecks#<sha>` pin に切り替える（axnos が `nijiurachan/axnospaint-for-aimg` を pin しているのと同じ形）。

### 2) Klecks embed を node_modules 経由に切り替える（axnos の完全ミラー）

- **配布物**: `ebine-lab/klecks`（後日 `nijiurachan/klecks`）に既存の build スクリプトで生成される `dist/`（`embed.js` + 153 個の同梱アセット）を、パッケージの`"files"` に含めて配布する。パッケージ名は upstream リポジトリ既存の名前をそのまま使う（`ebine-lab/klecks` の `package.json` の `name` を確認して踏襲。無ければ `klecks-for-aimg` 等を提案）。
- **package の exports** — Klecks embed は parcel-bundled で内部 URL が相対名参照。従って `import` はできず、ディレクトリを丸ごと配布 → コンシューマ側で静的配信するのが基本。
  - `./embed.js` → `"./dist/embed.js"`（Vite プラグインが dist ディレクトリ位置を `import.meta.resolve` で特定するアンカー）
  - `./vite` → コンシューマ向け Vite プラグイン
  - `./embed-url` → 埋め込み URL 定数
- **Vite プラグイン `klecksEmbed()`**（新規、パッケージ側で提供）:
  - `configureServer` で dev 時に `/{basePath}/assets/klecks/*` を `node_modules/<pkg>/dist/` から serve するミドルウェアを Vite の静的配信の前に登録。
  - `writeBundle` でビルド時に `dist/**` を `resolvedConfig.build.assetsDir` と同階層の `assets/klecks/` にそのままコピー（`assetsDir` は `join(".", basePath, "assets")` なので実出力は `dist/ts/assets/klecks/`）。ハッシュ・リネーム禁止（相対名参照を壊す）。
  - `config()` で `define: { __KLECKS_EMBED_URL__: JSON.stringify("/{basePath}/assets/klecks/embed.js") }` を注入。
- **`./embed-url`**: `export const klecksEmbedUrl: string = __KLECKS_EMBED_URL__;` の 1 行。

### 3) `+oekaki` サフィックスを付ける（`@nijiurachan/js` 側で 1 箇所修正）

`/workspace/nijiurachan-js/src/components/oekaki-paint-popup.ts:63` を

```ts
return { popup: config.klecks, fileTool: "oekaki" }  // was "klecks"
```

に変更。`upfile-input-fragment-v2.tsx` の `setImage()`（同ファイル `399:` 付近）は `${image.type}+${tool}` を組むので、Klecks の PNG は `image/png+oekaki` になり、バックエンドの 4 種 match に当たる。関連テスト `src/test/upfile/*.test.ts` に `+klecks` を asserts している箇所があれば `+oekaki` に更新。SHA を frontend-v1 の `@nijiurachan/js` pin へ反映。

### 4) 遅延ロードの確認（コード変更は最小、テストで保証）

現状ですでに遅延ロード済み — 起動時に読むのは `import.meta.resolve("#klecks")` の文字列解決のみでフェッチは走らず、`.popup()` 内で `about:blank` に `<script type=module src=...>` を注入した瞬間に初めて `src/klecks.ts` チャンクが読まれ、そのチャンクが `<klecks-paint-host>` の `connectedCallback` で `embed.js` を初めて `<script src>` 注入します。

守るために `KlecksPopup` 単体の guard test（bun:test）を追加:
- `KlecksPopup` を偽 URL で構築 → `fetch` / `window.open` が呼ばれないことを assert。
- `.popup()` 実行 → `window.open` が呼ばれ、注入 `<script>` が期待 URL を持つことを assert。

配置は `@nijiurachan/js` 側（`src/test/upfile/klecks-popup.test.ts` 系）が既にテストの家なのでそちらに追加。frontend-v1 側では追加不要。

## Critical files

**ebine-lab/klecks**（別クローン、別 PR）
- ソースに frontend-v1 版チューンナップ（少なくとも paste import 切除）を反映。
- `package.json` に Vite プラグインと `embed-url` の exports、`"files": ["dist"]` を追加。
- `src/vite-plugin.ts`, `src/embed-url.ts` を新規追加。

**@nijiurachan/js**（`/workspace/nijiurachan-js`、別 PR）
- `src/components/oekaki-paint-popup.ts:63` — `fileTool: "klecks"` → `fileTool: "oekaki"`。
- 該当テスト（`+klecks` を assert している箇所）を `+oekaki` に更新。
- `KlecksPopup` の lazy load guard test を追加。
- 版バンプ → frontend-v1 の pin SHA を更新。

**frontend-v1**（このリポ）
- `package.json` — `devDependencies` に `"klecks-for-aimg"`（または upstream の実パッケージ名）を `github:ebine-lab/klecks#<sha>` として追加。当面は fork pin、upstream マージ後に `nijiurachan/klecks#<sha>` へ切替。
- `vite.config.ts` — `env.VITE_KLECKS_EMBED_URL` 読み取りと関数引数 `klecksEmbedUrl` を撤去、`#klecks-embed` importmap エントリを削除、`plugins` 配列に `klecksEmbed()` を追加。
- `src/main.tsx:76-84` — `#klecks-embed` の resolve と env トリムを削除し、`import { klecksEmbedUrl } from "<pkg>/embed-url"` に置換。
- `src/vite-env.d.ts` — `VITE_KLECKS_EMBED_URL?: string` の行を削除。
- `wrangler.jsonc` — `/assets/klecks/*` の 2 route を削除（実出力が `/ts/assets/klecks/` になるので既存 `/ts/*` route でカバー）。
- `src/config/workerRoutes.test.ts` — `expectedRoutes` から klecks の 2 行を削除、テスト名から "bundled Klecks assets" を落とす。
- `public/assets/klecks/` を `git rm -rf`。

## Reused utilities / conventions

- Vite プラグイン方式は既に `vite.config.ts` の `addImportMap`, `generateIndexTsUnplugin`, `tscUnplugin` の形で使われているので同じスタイルで書ける。
- `KlecksPopup(src, embedSrc)` の 2 引数コンストラクタは維持（`@nijiurachan/js` 側に触らずに済むため）。
- `AXNOSPaint` を `axnospaint-for-aimg` から `import` している `axnos-paint-host.ts` が、`ebine-lab/klecks` に対する意匠上の下敷き。ただし axnos は ES モジュールとして `import` バンドルなのに対し、Klecks は parcel-bundled のディレクトリ配布なので**「ソースは npm パッケージ、配信は静的コピー」ハイブリッドになる**点だけ違う。

## Gotchas

- **チューンナップの逆引き**が最大の不確実性。frontend-v1 の `public/assets/klecks/` は minified で意図が読めないので、`git log` と PR 履歴を頼りに「何を切ったか」の意味論を先に特定する。1 個目（paste import 切除）が固まれば残りも同じ手順で拾えるはず。
- **`embed.js` の同梱アセットは相対パス**なので `dist/` をディレクトリ丸ごと同一構造で出力する（ハッシュ・リネーム禁止）。
- **出力先は `build.assetsDir` の同階層**に揃える。ハードコードせず `resolvedConfig.build.assetsDir` から算出。
- **dev ミドルウェアの登録順**は Vite 標準の静的配信より前に。
- **ポップアップは `about:blank`** → 相対 URL は about:blank を基点にしてしまうので、`klecksEmbedUrl` は絶対（`/ts/assets/klecks/embed.js`）を保つ。
- **hoisting**: `axnospaint-for-aimg` は frontend-v1（`a642aa2`）と `@nijiurachan/js`（`1f7a92a`）で SHA が違う二重宣言だが hoist 済み。同型で問題なし。プラグインは `import.meta.resolve` で位置を引くので hoisted でも見つかる。
- **`VITE_KLECKS_EMBED_URL` 撤去**: これを CI/deploy で上書きしていないか一度 grep してから消す（デフォルト前提の運用のはずだが要確認）。
- **fork → upstream 遷移**: ebine-lab/klecks で回している間はコンシューマ pin が fork を指す。upstream マージ後は pin だけ差し替えれば良いよう、パッケージ名・exports 構成・plugin API 名は最初から upstream 前提の名前で揃えておく。

## Verification

1. **要件 A — チューンナップ**
   - `ebine-lab/klecks` を localhost で起動 or 生成 dist を frontend-v1 に取り込んで開き、paste import 系 UI が存在しないことを確認。
   - 既存の描画ワークフロー（レイヤ、保存、送信）に regression が無いことを実挙動で確認。
2. **要件 1 — 配布経路**
   - `git status` で `public/assets/klecks/` が消えていることを確認。
   - `bun run build && ls dist/ts/assets/klecks/ | wc -l` が期待ファイル数（現行 154 相当、チューンナップで減っていれば減った数）。
   - `bun run preview` で Klecks を開き、Network タブで `embed.js` が `/ts/assets/klecks/embed.js` から 200 で返ることを確認。
3. **要件 2 — お絵描きフラグ**
   - `bun dev` で Klecks を起動し PNG を送信。DevTools Network の multipart で `Content-Type: image/png+oekaki` が乗ることを確認。
   - バックエンドローカルで `attachments.meta` に `{"is_oekaki": true}` が入り、カタログサムネにお絵描きバッジ（`text-otegaki`）が付くことを確認。
4. **要件 3 — 遅延ロード**
   - フレッシュリロード後、Network を `klecks` でフィルタして 0 件。
   - 「絵を描く」を押して初めて `klecks-*.js` チャンク → 続いて `embed.js` + 同梱アセットが読まれることを確認。
   - `@nijiurachan/js` 側の `klecks-popup.test.ts` guard test が緑。
5. **既存テスト回帰**
   - `bun lint && bun test` 通過（`workerRoutes.test.ts` の期待値更新後）。
