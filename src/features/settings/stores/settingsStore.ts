import {
  createSettingsStore as createSettingsStoreBase,
  type SettingsState as SettingsStoreBase,
  settingsStateCreator,
} from "@nijiurachan/js/io/settings-store";
import type { StoreApi } from "zustand";

/** 最小文字サイズ(px) */
export const FONT_SIZE_MIN = 8;
/** 最大文字サイズ(px) */
export const FONT_SIZE_MAX = 28;
/** 初期文字サイズ(px) */
export const FONT_SIZE_DEFAULT = 16;

/** 文字サイズを有効な範囲に丸める。異常値は初期値にフォールバック */
function clampFontSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return FONT_SIZE_DEFAULT;
  }
  return Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, Math.round(value)));
}

/** 表示設定のAPI */
export type SettingsStore = SettingsStoreBase & {
  /** 文字サイズ */
  fontSize: number;
  /** 文字サイズを設定 */
  setFontSize(value: number): void;
  /** 宇宙モード（映画オープニング風クロール表示）を有効にする */
  spaceMode: boolean;
  /** 宇宙モードを設定 */
  setSpaceMode(value: boolean): void;
};

/** 表示設定のストアを作る */
export const createSettingsStore: () => StoreApi<SettingsStore> = () =>
  createSettingsStoreBase(
    (...args) => {
      const [set] = args;
      const base = settingsStateCreator(...args);
      return {
        ...base,
        fontSize: FONT_SIZE_DEFAULT,
        setFontSize: (value: number) => set({ fontSize: clampFontSize(value) }),
        spaceMode: false,
        setSpaceMode: (spaceMode: boolean) => set({ spaceMode }),
        resetSettings(): void {
          base.resetSettings();
          set({
            fontSize: FONT_SIZE_DEFAULT,
            spaceMode: false,
          });
        },
      };
    },
    () => initSettings,
  );

/** 表示設定の初期化。ストレージ読込み後呼ばれる */
async function initSettings(store: SettingsStore | undefined): Promise<void> {
  if (!store) {
    return;
  }

  // 永続化された文字サイズが範囲外/壊れていた場合は補正
  const clamped = clampFontSize(store.fontSize);
  if (clamped !== store.fontSize) {
    store.setFontSize(clamped);
  }

  if (store.deleteKey) {
    return;
  }

  // クッキー値があったら引っ越し
  const cookieName = "user_delete_key";
  const cookieKey = await cookieStore.get(cookieName);
  if (cookieKey?.value) {
    store.setDeleteKey(cookieKey.value);
    await cookieStore.delete(cookieName);
  } else {
    store.resetDeleteKey();
  }
}
