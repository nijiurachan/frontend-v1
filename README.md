# @nijiurachan/frontend-v1

主にスマホを想定したあいもげ掲示板のReactベースクライアントです

## 技術スタック

- **React 19** - UIフレームワーク
- **Bun & Vite** - ビルドツール
- **TypeScript** - 型安全性
- **TanStack Router** - ファイルベースルーティング
- **TanStack Query** - サーバー状態管理
- **Zustand** - クライアント状態管理
- **Tailwind CSS v4** - スタイリング
- **Motion (Framer Motion)** - アニメーション

## プロジェクト構造

```
src/
├── app/                    # アプリケーション層
│   └── layouts/            # レイアウトコンポーネント
├── entities/               # ドメインモデル
│   ├── post/               # 投稿エンティティ
│   └── thread/             # スレッドエンティティ
├── features/               # 機能モジュール
│   ├── catalog/            # カタログ機能
│   ├── history/            # 閲覧履歴
│   ├── ng-filter/          # NGフィルター
│   ├── post/               # 投稿機能
│   ├── settings/           # 設定
│   └── thread/             # スレッド表示
├── pages/                  # ページコンポーネント
├── routes/                 # TanStack Routerルート定義
└── shared/                 # 共有リソース
    ├── api/                # APIクライアント
    ├── hooks/              # 汎用フック
    ├── lib/                # ユーティリティ
    └── ui/                 # 汎用UIコンポーネント
```

## 開発

```bash
# 依存関係インストール
bun install

# 開発サーバー起動（ローカルAPI使用）
bun dev

# 開発サーバー起動（本番API使用）
bun dev:prod

# ルート生成（手動）
bun routes

# ビルド（ローカルAPI用）
bun run build

# ビルド（本番API用）
bun build:prod

# プレビュー
bun preview
```

## API 設定

### 開発時

| コマンド        | ベースURL                              |
| --------------- | -------------------------------------- |
| `bun dev`      | `http://localhost:8080` (プロキシ経由) |
| `bun dev:prod` | `https://nijiurachan.net`              |

### ビルド時

| コマンド          | ベースURL                 |
| ----------------- | ------------------------- |
| `bun build`      | (空 = 相対パス)           |
| `bun build:prod` | `https://nijiurachan.net` |

### エンドポイント

ベースURLに対して以下のパスが使用されます：

- API: `{BASE_URL}/api`
- アップロード: `{BASE_URL}/uploads`

### カスタム設定

環境変数 `VITE_BASE_URL` で任意のベースURLを指定できます：

```bash
# 例: カスタムサーバーを使用
cross-env VITE_BASE_URL=https://example.com bun dev
```

## 主な機能

- 📱 **カタログ表示** - スレッド一覧のグリッド表示
- 🔄 **プルリフレッシュ** - スワイプで更新
- 📋 **ソート機能** - 新順/レス順/勢い/そうだね順
- 💬 **スレッド閲覧** - レス一覧表示
- ✏️ **投稿機能** - スレ立て/レス投稿
- 🖼️ **画像ギャラリー** - 別タブでスライド表示
- 📜 **閲覧履歴** - 最近見たスレッドを記録
- 🚫 **NGフィルター** - タイトル/ワード/正規表現でフィルタリング
- ⚙️ **設定** - 表示カスタマイズ

## Contributing

By contributing to this project, you agree that your contributions will be licensed under the MPL-2.0.

PR歓迎です。本プロジェクトは少人数で開発しているため、すぐに応対できない可能性がありますのでご了承ください。

## License

Unless otherwise stated in the source code files, @nijiurachan/frontend-v1 is licensed under the MPL-2.0 by nijiurachan contributors.

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
