# Turnstile Feature (root-mount toast)

Cloudflare Turnstile を「サイト共通の root 設置トースト」として動かすための
機能モジュール。投稿フォームから 3 つの hook 経由で token 取得・session 管理
を行い、フォーム側はストアや CF API を直接触らない。

---

## 仕様サマリ

### 1. Root 設置 + トースト挙動
- `<TurnstileProvider />` を root layout (例: `routes/__root.tsx`) に 1 個だけマウント
- 画面上端固定の **65px 高の widget bar** が、返信 / スレ立てモーダルが開いている間だけ
  スライドダウンする (`motion/react` で `y: -100% ↔ 0%`)
- 構造: `[ widget host (flex-1) | reset button 65×65 ]`
  - widget host: CF iframe (`appearance: 'always'`) と、下層に白パネル (status label) の二層
  - reset button: 連続エラー時等にユーザーが手動で再認証できる

### 2. 2 つのモード (light / stable)

| mode    | 旧来名     | 自動チャレンジ                          | hasSession 参照 |
|---------|-----------|-------------------------------------|----------------|
| stable  | 非 iOS 挙動 | idle で常時 (`runWhenIdle` でスケジュール) | 無視 |
| light   | iOS 挙動   | submit ボタン / focusout で 1 度だけ arm  | あり (true なら "empty" で送信) |

- 初回起動時のデフォルト: iOS → `light`、それ以外 → `stable`
- ユーザー設定は **cookie `aimg-turnstile-mode`** に永続化 (1 年)
- 設定 UI: 「設定」→「その他」タブ内の Toggle (`OtherSettings` セクション)
- mode 切替時に evaluator が再キックされ、stable→light で auto challenge が止まり、
  light→stable で再開する

### 3. Session (= hasSession bool)

- 「投稿 1 回成功でフラグが立つ」というだけの bool
- 立つ: post / thread create 成功時 (`useTurnstileOnPostSuccess`)
- 落ちる: 新スレ立てモーダル open (`light mode` 時のみ — fresh token 要求のため)
- アクティブ中は時間管理しない (バックエンド側が真の失効を判定するため、フロント予測は不正確になりがちだった経緯から bool 化)
- **reload 後の復活だけ 30 分窓を使う**: 非 empty token を使った投稿のたびに
  使用時刻を localStorage (`aimg-turnstile-last-token-usage`) に記録し
  (`recordTokenUsage`)、起動時に `Date.now() - 記録` が `SESSION_REVIVAL_WINDOW_MS`
  (30 分) 以内なら `hasSession=true` で起動する (`shouldReviveSession`)。フルリロード /
  他サイト経由で in-memory 値が消えても、短時間なら light mode の token 不要投稿が続く。
  `"empty"` で投稿した場合は記録を更新しない (窓は最後の実 token 使用から数える)。
- light mode のときだけ参照される。stable mode は完全に無視

### 4. 投稿時の token 解決ロジック

`useResolveTurnstileToken(kind)` が以下 3 ケースを内部で分岐:

1. **既に valid token (`state === "ready"`)**: そのまま使う (両 kind 共通)
2. **`kind === "reply"` かつ light mode + hasSession + 手元 token なし**: `"empty"` で短絡返却
   (バックエンドが session で認証判定。refresh を待たない)
3. **それ以外** (stable / light で session 無し / thread): `acquireTurnstileToken()` で待機

取得失敗時は内部で `alert` + `null` を返す。call site は `null` チェックだけで abort。

---

## ファイル構成

```
src/features/turnstile/
├── README.md                          ← この文書
├── components/
│   └── TurnstileProvider.tsx          ... root 設置の widget bar + state machine
├── stores/
│   ├── turnstileStore.ts              ... token / widget state / hasSession
│   └── turnstileModeStore.ts          ... mode (light/stable) + cookie 永続化
├── lib/
│   ├── isIOS.ts                       ... mode のデフォルト決定にだけ使用
│   ├── acquireToken.ts                ... 低レイヤ token 取得 (requestRefresh + awaitToken)
│   ├── lastTokenUsage.ts              ... 実 token 使用時刻の localStorage 記録 / reload 復活判定
│   └── awaitTokenError.ts             ... TurnstileTimeoutError / TurnstileUnmountError
└── hooks/
    ├── useResolveTurnstileToken.ts    ... 投稿時の token 取得 (kind 別戦略)
    ├── useTurnstileOnPostSuccess.ts   ... post 成功後の後処理 (recordTokenUsage + startSession + consumeToken)
    └── useTurnstileOnPostFailure.ts   ... post 失敗時の hook point (現状 no-op)
```

---

## 公開 API (フォーム側が触るのはこれだけ)

```ts
import {
  useResolveTurnstileToken,
  useTurnstileOnPostSuccess,
  useTurnstileOnPostFailure,
} from "@/features/turnstile/hooks";

// kind="reply" は session 短絡あり、"thread" は常に fresh token
const resolveTurnstileToken = useResolveTurnstileToken("reply");
const onTurnstileSuccess = useTurnstileOnPostSuccess();   // (tokenUsed: string) => void
const onTurnstileFailure = useTurnstileOnPostFailure();

// submit 内
const token = await resolveTurnstileToken();
if (token === null) return;            // alert 済み・呼び出し側は abort のみ
formData.set("cf-turnstile-response", token);
try {
  await submitMutation({ formData });
  onTurnstileSuccess(token);           // ← 使った token を渡す ("empty" なら使用時刻は記録しない)
} catch {
  onTurnstileFailure();
}
```

mode の手動切替 UI を作りたい場合のみ `useTurnstileModeStore` を直接購読:

```ts
import { useTurnstileModeStore } from "@/features/turnstile/stores/turnstileModeStore";
const mode = useTurnstileModeStore((s) => s.mode);
const setMode = useTurnstileModeStore((s) => s.setMode);
```

---

## 別プロジェクトへ移植する手順

### 0. 前提
- React 19 (`useSyncExternalStore` 必須)
- TypeScript strict 推奨
- Vite 環境変数 (`import.meta.env.*`) が使える
- Bun または npm 系パッケージマネージャ

### 1. 依存追加

```bash
bun add zustand motion react-icons
```

| パッケージ | バージョン | 用途 |
|-----------|----------|-----|
| zustand   | ^5.0     | store |
| motion    | ^12      | スライドダウンアニメ |
| react-icons | ^5     | `FiRefreshCw` (リセットボタン) |

### 2. プロジェクト側で用意するインフラ

#### a. `@/shared/lib` で以下を export
- `loadTurnstile(): Promise<Turnstile.Turnstile>` — CF script ローダー。キャッシュ + 失敗時にキャッシュをクリアして retry できる実装にすること
- `runWhenIdle(fn: () => void, opts: { timeout: number }): { cancel: () => void }` — `requestIdleCallback` ラッパー (古いブラウザ向け fallback 込み)

#### b. グローバルの cookieStore
標準 Cookie Store API (`window.cookieStore`) を使う。Safari など未対応のブラウザには polyfill を `main.tsx` の早い段階で `await initCookieStore()` する:

```ts
import { initCookieStore } from "@nijiurachan/js/util/cookie-store";
if (!window.cookieStore) {
  await initCookieStore();
}
```

#### c. 環境変数
- `VITE_TURNSTILE_SITE_KEY` — CF Turnstile のサイトキー (`.env` に設定)

#### d. CF Turnstile の型
`Turnstile.Turnstile` の型宣言 (`@types/cloudflare-turnstile` などを用意するか、`d.ts` で declare global)。

### 3. モーダル可視性ストアの用意

`TurnstileProvider` は以下 2 つの Zustand ストアを `subscribe` して `visible` を切り替える:

```ts
useReplyModalStore     // import { useReplyModalStore } from "@/features/thread/stores/replyModalStore"
useThreadCreateModalStore  // import { useThreadCreateModalStore } from "@/features/thread/stores/threadCreateModalStore"
```

それぞれ `{ isOpen: boolean }` を持つ最小ストアでよい。プロジェクトでモーダル構成が違うなら、
`TurnstileProvider.tsx` の以下 2 箇所を書き換える:

- visible 集約 (`useEffect` で `setVisible(replyOpen || threadCreateOpen)`)
- thread modal open 時の `clearSession` 購読

### 4. Provider のマウント

```tsx
// src/routes/__root.tsx もしくは layout component
import { TurnstileProvider } from "@/features/turnstile/components/TurnstileProvider";

<RootLayout>
  ...
  <TurnstileProvider />
  ...
</RootLayout>
```

position fixed + `z-[200]` で描画するので、他のヘッダー類との z-index 競合に注意。

### 5. フォームへの組み込み

#### 5-1. フォーム要素にマーカー属性を付ける

```tsx
<form data-turnstile-target-form="reply" onSubmit={handleSubmit}>
<form data-turnstile-target-form="thread" onSubmit={handleSubmit}>
```

light mode の focusout 駆動 (タイピング後の自動チャレンジ起動) が、この属性で
「reply フォーム内の `input` / `textarea` / `[contenteditable]`」を識別する。

#### 5-2. submit handler の典型構造

```ts
const resolveTurnstileToken = useResolveTurnstileToken("reply");
const onTurnstileSuccess = useTurnstileOnPostSuccess();
const onTurnstileFailure = useTurnstileOnPostFailure();
const [isBusy, setIsBusy] = useState(false);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (isBusy) return;
  setIsBusy(true);
  try {
    const token = await resolveTurnstileToken();
    if (token === null) return;     // hook 内で alert 済み

    const data = new FormData(e.currentTarget);
    data.set("cf-turnstile-response", token);
    // 他フィールド組み立て (重複防止のため append でなく set 推奨)

    try {
      await submitMutation({ formData: data });
      onTurnstileSuccess();         // hasSession=true, widget reset
    } catch {
      onTurnstileFailure();         // 現状 no-op だが hook 経由で
    }
  } finally {
    setIsBusy(false);
  }
};
```

**重要なポイント**:
- `setIsBusy(true)` を `await resolveTurnstileToken()` より **前** に置く (連打 race 防止)
- FormData のキー組み立ては `data.set` 推奨 (`<Textarea name="comment">` などと重複しないように)
- `onTurnstileSuccess(token)` に**実際に送った token を渡す**。`"empty"` 以外なら使用時刻を localStorage に記録し、reload 後の hasSession 復活に使う。内部で `recordTokenUsage()` → `startSession()` → `consumeToken()` の順 (後 2 つの順序は固定。逆にすると UI に "⌛️" が一瞬出る既知の落とし穴)

### 6. バックエンドの要件

フロントの mode 機構が意味を持つには、バックエンドが以下を満たす必要がある:

- POST endpoint で `cf-turnstile-response` フィールドを CF Turnstile API で verify
- 投稿成功時にサーバ側 session を発行 (cookie / fingerprint いずれかで識別)
- 以降の reply submit は token が `"empty"` でも session で認証して通す
- 新スレ立て は常に fresh token を要求する

これらが無いと light mode の「token なしで投稿」フローが成立しない。

---

## 内部仕様 (改修時の参考)

### widget state machine

```
   ┌──► idle ──[execute スケジュール]──► pending ──[setToken]──► ready
   │      ▲                                                       │
   │      │ stable: 即時 / light: focusout で arm                 │ consumeToken
   │      │                                                       │ (_refreshRequested)
   │   expired ◄──────────────────────────────────────────────────┘
   │      │
   │      ▼
   └── error ──[ERROR_BACKOFF_MS = 5s]──► idle
                                                       interaction-required
                                                       (CF の対話 UI)
```

- 失敗の自動リトライは `MAX_AUTO_RETRIES = 3` で抑止 (寝かしっぱなしのタブ対策)
- ユーザーが widget bar 右の更新ボタンを押すか、モーダルを開き直すとカウンタリセット
- light mode の `lightBlocksAuto` gate: `_pending === null && !lightTriggerArmedRef` でブロック
- evaluator は `useTurnstileModeStore.hydrated` が true になるまで何もしない。cookie 読込前は
  デフォルト mode (非 iOS で `stable`) になっており、そのまま評価すると light mode のユーザーでも
  一瞬 stable とみなされ `runWhenIdle` で auto challenge がスケジュールされてしまう
  (その後 mode が `light` に直っても scheduled な execute は走る)。hydrate 完了時に
  mode-store の subscribe 経由で再キックされる。`lightBlocksAuto` が true になった場合は
  既にスケジュール済みの `idleHandleRef` も cancel する (stable→light 切替 / hydrate race 対策)。

### consumeToken の設計 (奇妙だが意図的)

`consumeToken` は state を直接 `idle` にせず、`_refreshRequested=true` だけ立てて evaluator に委ねる。これは widget の visual reset (`turnstile.reset()`) を伴う必要があり、その API 呼び出しは `widgetId` を持つ Provider 側でしか叩けないため。`turnstileStore.ts` のコメントに詳細あり。

### startSession → consumeToken の順 (落とし穴)

`useTurnstileOnPostSuccess` 内で **必ず `startSession` を先に呼ぶ** こと。理由:

- consumeToken の evaluator チェーンは同期で `state: ready → idle` を動かす
- その途中で React 再レンダーが入ると `state=idle, hasSession=false` のスナップショットが描画される
- 結果として status panel が "✓ 投稿OK" ではなく "⌛️文章入力後に認証開始" を一瞬映してしまう
- 先に hasSession を true にしておけば、ready 中はパネル非表示・idle 復帰後は ✓ 表示でちらつかない

---

## 検証チェックリスト

- [ ] `bun lint` (eslint + biome) / `bun run build` 通過
- [ ] cookie `aimg-turnstile-mode` がリロード後も保持される (DevTools > Application > Cookies)
- [ ] **stable mode**: モーダル開く → 自動チャレンジ → token で投稿 → 再度モーダルで再チャレンジ
- [ ] **light mode 初回**: モーダル開いただけでは反応なし → 本文入力後 focusout で challenge 起動 → submit で token 取得 → 投稿
- [ ] **light mode 2 回目**: hasSession=true で `"empty"` 即送信、refresh 走らない
- [ ] **light mode + スレ立て**: モーダル open で hasSession 落ちる → 必ず fresh token
- [ ] **reload 復活**: light mode で実 token を使って投稿 → `aimg-turnstile-last-token-usage` が localStorage に入る → フルリロード → モーダルで "✓ 投稿OK" / submit で `"empty"` 即送信
- [ ] **reload 失効**: localStorage の値を 31 分前に書換 → リロード → "⌛️" / submit で challenge
- [ ] 投稿ボタン連打 → 1 リクエストのみサーバに到達 (DevTools Network)
- [ ] スレ立て成功時、サーバへの Form Data で `comment` が 1 件のみ
- [ ] iOS Safari (実機 / Simulator) で light mode 初期化される / cookie 永続化

---

## 既知の落とし穴 (移植時に踏まない用)

1. **modal store の購読を hardcode してある** — 別プロジェクトで `replyModal` / `threadCreateModal` 以外の名前を使うなら `TurnstileProvider.tsx` の 2 箇所を書き換え
2. **white panel の literal カラー** (`bg-white` / `text-gray-700`) は CF widget が常に白テーマ固定なのに合わせた意図的な逸脱。`darkMode` テーマがあるプロジェクトでも変えてはならない
3. **`data.append`** で FormData にフィールドを足すと、フォーム要素経由の同名キーと重複する。常に `data.set` で書く
4. **`useTurnstileOnPostSuccess` 内の順序** は `startSession` → `consumeToken` (逆にすると UI フラッシュ)
5. **`acquireTurnstileToken` を直接 form から呼ばない** — session 短絡が効かなくなり毎回 challenge が走る。必ず `useResolveTurnstileToken` 経由で
6. **`"empty"` 投稿では `LastTokenUsageTime` を更新しない** (意図的)。reload 復活窓は「最後に実 token を使った時刻」から数えるため。`onTurnstileSuccess` に渡す引数で判定している
