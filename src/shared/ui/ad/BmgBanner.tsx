import { type FunctionComponent, useEffect, useState } from "react";

/** ぶるもげちゃん広告サーバの配信ベースURL */
const ADS_BASE_URL = "https://ads.nijiurachan.net";

/**
 * 広告サーバ由来のURLを検証して正規化する。相対パスは配信ベースに解決し、
 * http(s) 以外のスキーム（`javascript:` / `data:` 等）は弾いて null を返す。
 * サーバが汚染された場合でも DOM の href/src に危険な値を渡さないための防御。
 */
function safeAdUrl(raw: string): string | null {
  try {
    // 空文字・空白のみは new URL("", base) が配信ベース自体（オリジン）に
    // 解決され有効扱いになってしまうため、先に弾いて非表示にする。
    if (raw.trim() === "") return null;
    const url = new URL(raw, ADS_BASE_URL);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** /ads/serve が返す広告1件 */
interface Ad {
  id: string;
  kind: "regular" | "house" | "placeholder";
  title: string;
  body: string;
  image_url: string;
  click_url: string;
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
 * モジュールが再評価されず、同一 slot への `/ads/serve` は1ページロードにつき
 * 1回だけ走る。大量のページ表示で広告サーバ（Workers）へ毎回直撃するのを防ぐ。
 *
 * 副作用としてセッション中は同じ広告が固定表示される（impression も1回のみ計上）
 * が、ここではリクエスト数を抑える方を優先する。フル再読み込みでリセットされる。
 */
const adCache: Map<string, Promise<Ad | null>> = new Map();

function fetchAd(slot: string): Promise<Ad | null> {
  const cached = adCache.get(slot);
  if (cached) return cached;

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

  adCache.set(slot, promise);
  return promise;
}

/**
 * ぶるもげちゃん広告サーバのバナーを表示する。
 *
 * - 取得は {@link fetchAd} 経由でページロード単位にキャッシュされる
 *   （同接数表示と同じ調子）。マウントごとには fetch しない。
 * - 204（配信対象なし）/ エラー / 広告なし のときは何も描画しない
 *   （広告が出ないことを許容する設計）。
 * - 入稿規格 468×80px に合わせて max-width を制限し、レスポンシブ表示する。
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
  // http(s) 以外のスキーム（javascript: / data: 等）は弾く。不正なら非表示。
  const clickUrl = safeAdUrl(ad.click_url);
  const imageUrl = safeAdUrl(ad.image_url);
  if (!clickUrl || !imageUrl) return null;

  return (
    <div className="flex justify-center border-b border-border bg-background px-2 py-2">
      <a
        href={clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full max-w-[468px]"
      >
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
      </a>
    </div>
  );
};
