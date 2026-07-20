import { useCallback, useEffect, useState } from "react";
import {
  type AnnounceIcon,
  addAnnounceIcon,
  listAnnounceIcons,
  removeAnnounceIcon,
} from "@/features/settings/lib/announceIconDb";

/** ミューテーション後にsubscriberへ通知するためのモジュール内ハブ */
const listeners: Set<() => void> = new Set();

function notify(): void {
  for (const l of listeners) l();
}

/** 運営告知バナーアイコン(IndexedDB)を購読するフック */
export function useAnnounceIcons(): {
  icons: AnnounceIcon[];
  loading: boolean;
  add(blob: Blob): Promise<void>;
  remove(id: number): Promise<void>;
} {
  const [icons, setIcons] = useState<AnnounceIcon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const reload = async (): Promise<void> => {
      try {
        const list = await listAnnounceIcons();
        if (cancelled) return;
        setIcons(list);
      } catch (e) {
        console.warn("useAnnounceIcons: 読込に失敗", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const listener = (): void => {
      void reload();
    };
    listeners.add(listener);
    void reload();
    return (): void => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  const add = useCallback(async (blob: Blob): Promise<void> => {
    await addAnnounceIcon(blob);
    notify();
  }, []);

  const remove = useCallback(async (id: number): Promise<void> => {
    await removeAnnounceIcon(id);
    notify();
  }, []);

  return { icons, loading, add, remove };
}
