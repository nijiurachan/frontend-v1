# Aimoge extension hooks

`window.aimoge` は旧PC版の userscript 文化向けの同期フックAPIです。APIの
`version` は `1` です。フックはアプリのデータ取得・描画に限定して動作し、拡張から
ネットワークや内部状態へ直接アクセスするAPIは提供しません。

## 起動前登録

userscript がアプリより先に実行される場合は、`window.aimogeQueue` に登録関数を
追加します。アプリ起動時にキューをドレインし、登録関数へ `aimoge` APIを渡した後、
`document` へ `aimoge:ready` を発火します。

```js
(function () {
  function install(aimoge) {
    aimoge.register("post:beforeRender", function (post) {
      return post;
    });
  }

  if (window.aimoge) {
    install(window.aimoge);
  } else {
    (window.aimogeQueue = window.aimogeQueue || []).push(install);
  }
})();
```

起動後に登録する場合は `window.aimoge.register(name, callback)` を直接呼びます。

```js
document.addEventListener("aimoge:ready", function (event) {
  var aimoge = event.detail.aimoge;
  console.log("Aimoge hook API", aimoge.version);
});
```

## API

```ts
interface AimogeApi {
  readonly version: 1;
  register(
    name: AimogeHookName,
    callback: (value: unknown) => unknown,
  ): () => void;
}
```

`register` の戻り値はそのフックだけを解除する関数です。登録順に呼ばれるため、
複数の data/before フックはチェーンになります。コールバックが `undefined` を返した
場合は現在値を維持します。

### data hooks

次のフックは現在値を受け取り、返した値で置き換えます。

| フック | 値 |
| --- | --- |
| `data:thread` | スレッド詳細またはカタログの1スレッド |
| `data:catalog` | カタログレスポンス全体 |
| `data:chunk` | チャンクレスポンスの配列 |
| `data:state` | stateレスポンス |

```js
aimoge.register("data:thread", function (thread) {
  return Object.assign({}, thread, { extensionSeen: true });
});
```

### beforeRender hooks

`catalog:beforeRender` はカタログのスレッド、`post:beforeRender` は投稿を受け取り
ます。加工した値を返せます。`null` を返すとその要素を描画しません。

beforeRender は再描画時にも実行されるため、同じ入力に対して同じ結果を返す純粋な
処理にしてください。

### rendered hooks

`catalog:rendered` の値は `{ thread, element, threadId }`、`post:rendered` の値は
`{ post, element, threadId }` です。`element` は描画済みの実DOM要素です。rendered
フックは要素の mount ごとに発火します。仮想化されたレスは unmount/remount される
ため、拡張側でDOMへ装飾を加える場合は `data-*` マーカーで冪等化してください。

```js
aimoge.register("post:rendered", function (payload) {
  if (payload.element.dataset.extensionMarked) return;
  payload.element.dataset.extensionMarked = "1";
  payload.element.classList.add("my-extension-post");
});
```

すべてのフックは同期関数です。各フックは個別に `try/catch` され、例外は
`console.warn` に出力されて後続フックの実行を妨げません。実行時間が長いフックも
`console.warn` で警告されます。

## サンプル

- [NG拡張](./examples/aimoge-ng.user.js)
- [カタログ装飾](./examples/aimoge-catalog-decoration.user.js)
