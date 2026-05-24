# CLAUDE.md

このファイルは、このリポジトリで作業する際にClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクト概要

あいもげimageboard用のReactベースビューワー。モバイルファーストのユーザー体験を重視した最新のWeb技術で構築されています。

## 開発コマンド

このプロジェクトは必ずbunを使用してください。npm, yarn, pnpmは使用しないでください。

```bash
# 依存関係のインストール
bun install

# パッケージの追加
bun add <package-name>

# 開発依存パッケージの追加
bun add -D <package-name>

# 開発サーバー起動（ローカルAPIをプロキシ経由で使用）
bun dev

# 開発サーバー起動（本番APIを使用）
bun dev:prod

# 本番ビルド（相対パス）
bun run build

# 本番ビルド（絶対APIパス指定）
bun run build:prod

# TanStack Routerのルート生成
bun routes

# Lint実行
bun lint

# 本番ビルドのプレビュー
bun preview

# フォーマット
bun fix
```

## アーキテクチャ

### Feature-Sliced Design (FSD)

コードベースは簡略化されたFSDアーキテクチャに従っています：

- **`src/app/`** - アプリケーション層（レイアウトとルート設定）
- **`src/entities/`** - ドメインモデルとビジネスロジック（thread, post）
- **`src/features/`** - 独立した機能モジュール（catalog, thread, post, history, ng-filter, settings）
- **`src/pages/`** - 機能を組み合わせたページコンポーネント
- **`src/routes/`** - TanStack Routerのファイルベースルーティング定義
- **`src/shared/`** - 再利用可能なユーティリティ、フック、UIコンポーネント、APIクライアント

各機能モジュールの構成：
- `components/` - 機能固有のビジネスロジックを含むコンポーネント
- `ui/` - 機能専用のUIコンポーネント（その機能でのみ使用）
- `hooks/` - 機能固有のReactフック
- `stores/` - Zustand状態管理（必要な場合）

### 状態管理戦略

**TanStack Query**でサーバー状態を管理：
- スレッド一覧とスレッド詳細のフェッチとキャッシュ
- クエリキー: `['threads', sortType]`、`['thread', threadId]`、`['ogp', url]`
- デフォルト設定: staleTime 30秒、retry 1回
- OGP情報は1時間キャッシュ

**Zustand + persist**でクライアント状態を管理：
- `catalogStore` - ソート設定、グリッド列数、アニメーション設定、検索クエリ、最後に見たカタログ状態
- `historyStore` - スレッド閲覧履歴（最大100件）
- `ngStore` - NGフィルター設定（非表示スレッド、タイトル/ワード/正規表現フィルター）
- `settingsStore` - ユーザー設定

すべてのストアはlocalStorageに永続化され、以下のキーを使用：
- `aimg-catalog-settings`
- `aimg-history`
- `aimg-ng-settings`
- `aimg-settings`

### APIクライアントアーキテクチャ

APIクライアント（`src/shared/api/client.ts`）が提供する機能：
- `apiGet<T>(path)` - 自動JSON解析付きGETリクエスト
- `apiPost<T>(path, body)` - FormDataとJSONの両方に対応したPOSTリクエスト
- カスタム`ApiError`クラスでエラー処理

APIベースURLは`VITE_BASE_URL`環境変数で設定：
- 開発時: Vite経由でプロキシ（`/api` → `http://localhost:8080`）
- 本番時: 絶対URLを指定するか、空にして相対パスを使用

### ルーティング構造

TanStack Routerのファイルベースルーティング：
- `routes/__root.tsx` - QueryClientProviderを含むルートレイアウト
- `routes/index.tsx` - カタログページ（ホーム）
- `routes/thread.$threadId.tsx` - スレッド詳細ページ

ルートツリーは`src/routeTree.gen.ts`に自動生成されます。ルートファイルを追加・変更した後は`bun routes`を実行してください。

### パスエイリアス

TypeScriptとViteは`@/*`エイリアスを`src/*`へ設定しています。インポートには必ずこのエイリアスを使用してください：
```typescript
import { apiGet } from '@/shared/api'
import { useThreads } from '@/features/catalog/hooks'
```

## スタイリングとUIガイドライン

### カラーテーマシステム

UIカラーはカラーテーマで変更できる前提で設計されています。Tailwindのカラークラスはセマンティックカラー（`primary`、`secondary`など）を使用し、具体的な色名（`blue-500`、`gray-100`など）は避けてください。

**推奨するカラーパターン：**
```typescript
// 良い例 - セマンティックカラーを使用
<div className="bg-primary text-primary-foreground">
<button className="bg-secondary hover:bg-secondary/90">

// 避けるべき例 - 具体的な色を直接指定
<div className="bg-blue-500 text-white">
<button className="bg-gray-200 hover:bg-gray-300">
```

**カラーパレット構成：**
- `primary` / `primary-foreground` - メインアクション、強調要素
- `secondary` / `secondary-foreground` - サブアクション、補助要素
- `background` - ページ背景
- `foreground` - メインテキスト
- `muted` / `muted-foreground` - 控えめな背景とテキスト
- `accent` / `accent-foreground` - アクセント要素
- `destructive` / `destructive-foreground` - 削除・警告アクション
- `border` - ボーダーカラー

新しいコンポーネントを実装する際は、必ずこれらのセマンティックカラーを使用し、テーマ切り替えに対応できるようにしてください。

### アイコンシステム

UIアイコンには**React Icons**ライブラリを使用します。このライブラリは複数のアイコンセットを統一されたAPIで提供します。

**推奨するアイコンの使用方法：**
```typescript
import { FiSettings, FiX, FiCheck } from 'react-icons/fi'; // Feather Icons
import { HiOutlineMenu } from 'react-icons/hi'; // Heroicons
import { MdRefresh } from 'react-icons/md'; // Material Design Icons

// 使用例
<FiSettings className="text-foreground" size={20} />
<button className="text-primary hover:text-primary/80">
  <FiCheck size={24} />
</button>
```

**利用可能な主要アイコンセット：**
- `react-icons/fi` - Feather Icons（シンプルで洗練されたアイコン）
- `react-icons/hi` - Heroicons（Tailwind UIと相性が良い）
- `react-icons/md` - Material Design Icons（豊富なバリエーション）
- `react-icons/bi` - BoxIcons（アウトライン/ソリッドの両方）
- その他多数のアイコンセットが利用可能

**アイコンスタイリングのベストプラクティス：**
- セマンティックカラーを使用してテーマ対応にする（`text-foreground`、`text-primary`など）
- サイズは`size`プロップまたはTailwindの`text-xl`などで指定
- アクセシビリティのため、装飾的なアイコンには`aria-hidden="true"`を追加
- ボタン内のアイコンのみの場合は、適切な`aria-label`を提供

## 主要な実装パターン

### コンポーネント設計原則

**UIコンポーネントの配置ルール：**

1. **共通UIコンポーネント (`src/shared/ui/`)**
   - プロジェクト全体で再利用可能な汎用UIコンポーネント
   - 複数の機能・ページで使用されるコンポーネント
   - カテゴリ別にディレクトリ分けして配置：
     - `form/` - Button, Input, Textarea, Checkbox, Toggle, ImageUpload
     - `feedback/` - Loading, Message
     - `overlay/` - Modal, ModalContext
     - `navigation/` - TextLink
     - `media/` - VideoBadge, VideoPlayOverlay

2. **機能専用UIコンポーネント (`src/features/[機能名]/ui/`)**
   - 特定の機能でのみ使用されるUIコンポーネント
   - 他の機能では使用されないが、その機能内で再利用されるコンポーネント
   - 例：
     - `features/settings/ui/` - SettingRow, SettingSection, Select
     - `features/thread/ui/` - BottomActionBar, ImageViewer, PostActionMenu, PostListDisplay

**UIコンポーネント設計のベストプラクティス：**
- 共通UIロジックは必ず専用のコンポーネントに分離する
- ページ内で直接スタイルを書くのではなく、コンポーネント化してUIロジックを移譲する
- コンポーネントは`props`を通じて柔軟に動作を変更できるようにする
- 最初は機能専用として作成し、複数箇所で使用されるようになったら共通化を検討

**例：設定画面の場合**
```typescript
// ❌ 悪い例：ページ内で直接スタイルを繰り返し記述
<div className="px-4 py-3 bg-card">...</div>
<div className="px-4 py-3 bg-card">...</div>

// ✅ 良い例：機能専用UIコンポーネントに移譲
import { SettingRow } from '@/features/settings/ui';
<SettingRow label="設定名">{children}</SettingRow>
```

### 機能モジュールパターン

新機能を追加する際は、既存の構造に従ってください：
```
src/features/[機能名]/
├── components/           # ビジネスロジックを含むコンポーネント
│   ├── [コンポーネント].tsx
│   └── index.ts
├── ui/                  # 機能専用のUIコンポーネント（オプション）
│   ├── [UIコンポーネント].tsx
│   └── index.ts
├── hooks/
│   ├── use[フック名].ts
│   └── index.ts
├── stores/
│   └── [機能名]Store.ts
└── index.ts
```

**components/ と ui/ の使い分け：**
- `components/` - データフェッチ、状態管理、ビジネスロジックを含むコンポーネント
- `ui/` - プレゼンテーション専用で、その機能でのみ使用されるUIコンポーネント

**例：**
```
features/settings/
├── components/
│   ├── DisplaySettings.tsx  # ストアと連携、ビジネスロジック含む
│   └── NgSettings.tsx
├── ui/
│   ├── SettingRow.tsx       # プレゼンテーション専用
│   ├── SettingSection.tsx
│   └── Select.tsx
└── ...
```

### APIクエリフック

サーバーデータ取得フックはTanStack Queryを使用：
```typescript
export function useThreads() {
  const { currentSort } = useCatalogStore();

  return useQuery({
    queryKey: ['threads', currentSort],
    queryFn: async () => {
      const sortParam = currentSort !== 'default' ? `?sort=${currentSort}` : '';
      return apiGet<ThreadsResponse>(`/threads${sortParam}`);
    },
  });
}
```

### NGフィルターと検索ロジック

**NGフィルター**

スレッドのフィルタリングは`ngStore.isThreadHidden()`に集約されており、以下をチェックします：
1. スレッドIDの直接非表示
2. `ngTitles`リストとのタイトル照合
3. `ngWords`リストとのテキスト内容照合
4. `ngRegexes`リストとの正規表現パターン照合

テキスト照合前にHTMLタグは除去されます。

**カタログ検索**

`useFilteredThreads`フックがスレッド一覧に以下のフィルターを適用：
1. NGフィルター（非表示スレッドを除外）
2. 検索クエリ（スレッド本文をHTMLタグ除去後に検索）

検索クエリは`catalogStore.searchQuery`に保存され、`SearchBar`コンポーネントから更新可能。

## 主要機能

### カタログ検索機能

**コンポーネント：**
- `features/catalog/components/SearchBar` - 検索入力UIとクリアボタン
- `features/catalog/hooks/useFilteredThreads` - NGフィルターと検索の統合

**動作：**
- スレッド本文（HTMLタグ除去後）を部分一致検索
- 検索クエリは`catalogStore`に永続化
- NGフィルターと組み合わせて動作

### OGPリンクプレビュー機能

**コンポーネント：**
- `features/thread/components/OgpCard` - OGPカード表示（YouTube/X埋め込み対応）
- `features/thread/components/OgpCardList` - レス内の複数リンクのOGP表示管理
- `shared/hooks/useOgp` - OGP情報取得フック（TanStack Query、1時間キャッシュ）

**動作：**
- レス内のURLを自動検出し、OGP情報を表示
- YouTube動画はiframe埋め込みで表示
- X/Twitterはツイート埋め込みウィジェットを使用
- OGP画像はクリックで拡大表示（`ImageViewer`使用）
- バックエンドに`/api/ogp?url=...`エンドポイントが必要

**ユーティリティ：**
- `shared/lib/extractLinks` - レスからURL抽出
- `shared/lib/mediaType` - YouTubeやX URLの判定と情報抽出

### 引用レス機能

**コンポーネント：**
- `features/thread/components/modals/QuoteSearchModal` - 引用文から元レスを検索
- `features/thread/components/modals/QuoteSourcesModal` - 特定レスを引用しているレスの一覧
- `features/thread/components/PostDisplay` - レス表示の共通コンポーネント
- `features/thread/ui/PostListDisplay` - レスリスト表示UI

**動作：**
- 引用文（`> 〜`）をクリックすると、その内容を含むレスを検索表示
- レス番号リンクをクリックすると、そのレスを引用している全レスを表示
- 引用関係は`extractQuoteReferences`で事前に解析してマップ化

**ユーティリティ：**
- `features/thread/utils/extractQuoteReferences` - レス間の引用関係を解析
- `shared/lib/quoteUtils` - 引用テキストの抽出と除外
  - `stripQuoteLines` - 引用行を除外
  - `extractQuoteTexts` - 引用部分を抽出
- `shared/lib/htmlToPlainText` - HTMLをプレーンテキストに変換

## ビルドシステム

- **Vite** - ビルドツールと開発サーバー
- **TanStack Router Plugin** - ルートツリーの自動生成
- **Tailwind CSS v4** - Viteプラグイン統合

ビルドプロセス: `bun build`

## TypeScript設定

Strictモード有効、追加のLintルール：
- `noUnusedLocals`, `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`

ターゲット: ES2024 with DOM libraries
