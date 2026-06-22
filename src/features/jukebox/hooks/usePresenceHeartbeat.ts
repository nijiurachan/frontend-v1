// src/features/jukebox/hooks/usePresenceHeartbeat.ts
import { useEffect } from "react";
import { jukeboxClient } from "../api/jukeboxClient";

const PRESENCE_INTERVAL_MS = 10_000;

export function usePresenceHeartbeat(): void {
  useEffect((): (() => void) => {
    // 即時 1 回送信してからインターバル開始
    void jukeboxClient.postPresence();
    const id = setInterval((): void => {
      void jukeboxClient.postPresence();
    }, PRESENCE_INTERVAL_MS);
    return (): void => clearInterval(id);
  }, []);
}
