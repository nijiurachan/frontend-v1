import { type FunctionComponent, useEffect, useState } from "react";

/** ぶるもげちゃん広告サーバの配信ベースURL */
const ADS_BASE_URL = "https://ads.nijiurachan.net";

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

  return (
    <div className="flex justify-center border-b border-border bg-background px-2 py-2">
      <a
        href={ad.click_url}
        target="_blank"
        rel="noopener sponsored"
        className="block w-full max-w-[468px]"
      >
        <img
          src={ad.image_url}
          alt={ad.title}
          loading="lazy"
          className="h-auto w-full"
        />
      </a>
    </div>
  );
};
