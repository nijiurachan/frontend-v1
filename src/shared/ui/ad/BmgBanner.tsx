import { type FunctionComponent, useEffect, useState } from "react";
import { ADS_BASE_URL, safeAdUrl } from "./safeAdUrl";

/** /ads/serve が返す広告1件 */
interface Ad {
  id: string;
  kind: "regular" | "house" | "placeholder";
  title: string;
  body: string;
  image_url: string;
  /** 通常広告は URL 文字列。null はリンク無し広告（ブランド露出のみ）。 */
  click_url: string | null;
}

interface BmgBannerProps {
  /** 広告枠識別子（現状 "default" のみ。省略時 "default"） */
  slot?: string;
}

/**
 * slot ごとの広告取得結果をページロード単位でキャッシュする。
 *
 * 同接数表示（`OnlineUsersIndicatorElement`）と同じ調子で、モジュールレベルの
 * 共有 Promise に取得結果を保持する。SPA なのでカタログ⇄スレッドの画面遷移では
 * モジュールが再評価されず、同一 slot への `/ads/serve` は基本1回だけ走る。
 * 大量のページ表示で広告サーバ（Workers）へ毎回直撃するのを防ぐ。
 *
 * ただし SPA（特にスマホ）はフル再読み込みがほぼ発生しないため、それだけだと
 * セッション中ずっと同じ広告が固定表示されてしまう。そこで {@link AD_CACHE_TTL_MS}
 * の有効期限を設け、期限切れ後に**バナーが次にマウントされた時だけ**取り直す。
 * 画面遷移（= マウント）が「再読み込みの代わり」になる。タイマーや
 * visibilitychange 監視を使わないので、アイドル時の負荷はゼロ。
 */
const AD_CACHE_TTL_MS: number = 10 * 1000;

interface AdCacheEntry {
  promise: Promise<Ad | null>;
  /** 取得を開始した時刻（epoch ms）。TTL 判定に使う。 */
  fetchedAt: number;
}

const adCache: Map<string, AdCacheEntry> = new Map();

function fetchAd(slot: string): Promise<Ad | null> {
  // 呼び出しは useEffect 内（描画中ではない）なので Date.now() の参照は安全。
  const now = Date.now();
  const cached = adCache.get(slot);
  // TTL 内のキャッシュはそのまま再利用。期限切れ/未取得なら取り直す。
  if (cached && now - cached.fetchedAt < AD_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = (async (): Promise<Ad | null> => {
    try {
      const res = await fetch(
        `${ADS_BASE_URL}/ads/serve?slot=${encodeURIComponent(slot)}&n=1`,
      );
      // 204 は 2xx なので res.ok では弾けない。明示的に除外する。
      if (res.status === 204 || !res.ok) return null;
      const data = (await res.json()) as { ads?: Ad[] };
      return data.ads?.[0] ?? null;
    } catch {
      // ネットワークエラー / 障害時は広告なし扱い
      return null;
    }
  })();

  adCache.set(slot, { promise, fetchedAt: now });
  return promise;
}

/**
 * ぶるもげちゃん広告サーバのバナーを表示する。
 *
 * - 取得は {@link fetchAd} 経由でページロード単位にキャッシュされる
 *   （同接数表示と同じ調子）。マウントごとには fetch しない。
 * - 204（配信対象なし）/ エラー / 広告なし のときは何も描画しない
 *   （広告が出ないことを許容する設計）。
 * - 入稿規格 468×60px に合わせて max-width を制限し、レスポンシブ表示する。
 *
 * クリックは `click_url`（= `/ads/click/:id`）アクセス時にサーバ側で
 * 302 リダイレクト + click 計上される。
 */
export const BmgBanner: FunctionComponent<BmgBannerProps> = ({
  slot = "default",
}: BmgBannerProps) => {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    let active = true;
    void fetchAd(slot).then((result) => {
      // 共有 Promise を使うため AbortController は使わず、
      // アンマウント後の setState だけ active フラグで防ぐ。
      if (active) setAd(result);
    });
    return (): void => {
      active = false;
    };
  }, [slot]);

  if (!ad) return null;

  // サーバ由来のURLは DOM に渡す前に検証する。相対パスは配信ベースに解決し、
  // 許可ドメイン以外や危険なスキームは弾く。画像URLは必須で、無効なら非表示。
  const imageUrl = safeAdUrl(ad.image_url);
  if (!imageUrl) return null;

  // click_url が null（リンク無し広告）/ 不正URLのときはリンクを作らず、
  // <img> 単体で描画する（アンカー無し・onClick 無しでクリックしても何も起きない）。
  const clickUrl = safeAdUrl(ad.click_url);

  const image = (
    <img
      src={imageUrl}
      alt={ad.title}
      loading="lazy"
      // 配信元(storage.nijiurachan.net)はリファラ(ホットリンク)保護があり、
      // 許可ドメイン以外（localhost 等）からの Referer を 403 で弾く。
      // Referer を送らなければ環境を問わず取得でき、閲覧中スレッドのURLを
      // 広告CDNへ漏らさないプライバシー面のメリットもある。
      referrerPolicy="no-referrer"
      className="h-auto w-full"
    />
  );

  return (
    <div className="flex justify-center border-b border-border bg-background px-2 py-2">
      {clickUrl ? (
        <a
          href={clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full max-w-[468px]"
        >
          {image}
        </a>
      ) : (
        <div className="block w-full max-w-[468px]">{image}</div>
      )}
    </div>
  );
};
