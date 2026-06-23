// src/features/jukebox/hooks/usePresenceHeartbeat.ts
import { useEffect } from "react";
import { jukeboxClient } from "@/features/jukebox/api/jukeboxClient";

const PRESENCE_INTERVAL_MS = 10_000;

export function usePresenceHeartbeat(): void {
  useEffect((): (() => void) => {
    let sending = false;

    const send = (): void => {
      if (sending) return;
      sending = true;
      jukeboxClient
        .postPresence()
        .catch((err: unknown): void => {
          console.warn("[usePresenceHeartbeat] postPresence failed:", err);
        })
        .finally((): void => {
          sending = false;
        });
    };

    // 即時 1 回送信してからインターバル開始
    send();
    const id = setInterval(send, PRESENCE_INTERVAL_MS);
    return (): void => clearInterval(id);
  }, []);
}
