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
 * - 取得確定で広告なし（204/エラー/不正）のときは何も描画しない（高さ0に畳む）。
 * - 入稿規格 468×60 に高さを固定し（aspect-ratio）、取得中も枠を確保するため、
 *   読み込み・ローテーション時にレイアウトシフト（カクッ）が起きない。画像は
 *   object-cover で枠を満たす。
 *
 * クリックは `click_url`（= `/ads/click/:id`）アクセス時にサーバ側で
 * 302 リダイレクト + click 計上される。
 */
export const BmgBanner: FunctionComponent<BmgBannerProps> = ({
  slot = "default",
}: BmgBannerProps) => {
  // undefined = 取得中, null = 広告なし確定, Ad = 取得済み。
  // 取得中も枠を確保したいので初期値は undefined（null と区別する）。
  const [ad, setAd] = useState<Ad | null | undefined>(undefined);

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

  // 取得が確定して「広告なし」(204/エラー/不正) なら何も描画しない（高さ0に畳む）。
  if (ad === null) return null;

  // 取得済みなら URL を検証する。相対パスは配信ベースに解決し、許可ドメイン以外や
  // 危険なスキームは弾く。取得済みで画像URLが不正なら広告なし扱い。
  const imageUrl = ad ? safeAdUrl(ad.image_url) : null;
  if (ad && !imageUrl) return null;

  // click_url が null（リンク無し広告）/ 不正URLのときはリンクを作らず、
  // <img> 単体で描画する（アンカー無し・onClick 無しでクリックしても何も起きない）。
  const clickUrl = ad ? safeAdUrl(ad.click_url) : null;

  // 468×60 に高さを固定する枠（背景は指定なし＝透明）。取得中も含め常にこの枠を
  // 確保するため、読み込み・広告ローテーション時にレイアウトシフト（カクッ）が
  // 起きない。広告は全て 468×60 入稿前提なので、画像はちょうど枠を満たす。
  const frameClassName = "block aspect-[468/60] w-full max-w-[468px]";

  const image = imageUrl && (
    <img
      src={imageUrl}
      alt={ad?.title ?? ""}
      loading="lazy"
      // 配信元(storage.nijiurachan.net)はリファラ(ホットリンク)保護があり、
      // 許可ドメイン以外（localhost 等）からの Referer を 403 で弾く。
      // Referer を送らなければ環境を問わず取得でき、閲覧中スレッドのURLを
      // 広告CDNへ漏らさないプライバシー面のメリットもある。
      referrerPolicy="no-referrer"
      className="h-full w-full object-contain"
    />
  );

  return (
    <div className="flex justify-center border-b border-border bg-background px-2 py-2">
      {clickUrl ? (
        <a
          href={clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={frameClassName}
        >
          {image}
        </a>
      ) : (
        <div className={frameClassName}>{image}</div>
      )}
    </div>
  );
};
