import { type FunctionComponent, useEffect, useState } from "react";
import { API_BASE } from "@/shared/api";

/**
 * 同接数（`/api/online-users`）の取得結果をページ内でキャッシュする TTL（ms）。
 *
 * 広告バナー（`BmgBanner`）と同じ調子で、モジュールレベルの共有 Promise に
 * 結果を保持し、TTL 内は再取得しない。SPA なのでフォームの再オープンや画面遷移の
 * たびには叩かず、TTL 経過後の次マウント時だけ取り直す。タイマーや
 * visibilitychange 監視は使わないのでアイドル時の負荷はゼロ。
 *
 * 同接数は広告(10秒)ほど鮮度が要らないので、広告より長め（30秒）にしている。
 */
const ONLINE_USERS_TTL_MS: number = 30 * 1000;

interface OnlineUsersCache {
  promise: Promise<string | null>;
  /** 取得を開始した時刻（epoch ms）。TTL 判定に使う。 */
  fetchedAt: number;
}

let onlineUsersCache: OnlineUsersCache | undefined;

function fetchOnlineUsers(): Promise<string | null> {
  // 呼び出しは useEffect 内（描画中ではない）なので Date.now() の参照は安全。
  const now = Date.now();
  if (
    onlineUsersCache &&
    now - onlineUsersCache.fetchedAt < ONLINE_USERS_TTL_MS
  ) {
    return onlineUsersCache.promise;
  }

  const promise: Promise<string | null> = fetch(`${API_BASE}/online-users`)
    .then((res) => (res.ok ? res.text() : ""))
    .then((text) => {
      // サーバは人数の数字のみを返す。数字以外（空/エラーHTML等）は表示しない。
      const trimmed = text.trim();
      return /^\d+$/.test(trimmed) ? trimmed : null;
    })
    .catch(() => null);

  onlineUsersCache = { promise, fetchedAt: now };
  return promise;
}

interface OnlineUsersIndicatorProps {
  className?: string;
}

/**
 * 「現在N人くらいが見てます.」を表示する。取得できない / 不正値のときは
 * 何も描画しない。取得は {@link fetchOnlineUsers} 経由で TTL キャッシュされる。
 */
export const OnlineUsersIndicator: FunctionComponent<
  OnlineUsersIndicatorProps
> = ({ className }: OnlineUsersIndicatorProps) => {
  const [count, setCount] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchOnlineUsers().then((result) => {
      // 共有 Promise を使うため、アンマウント後の setState だけ防ぐ。
      if (active) setCount(result);
    });
    return (): void => {
      active = false;
    };
  }, []);

  if (!count) return null;

  return <span className={className}>{`現在${count}人くらいが見てます.`}</span>;
};
