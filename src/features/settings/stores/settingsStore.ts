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

/** 最小文字倍率(%) */
export const FONT_SCALE_MIN = 50;
/** 最大文字倍率(%) */
export const FONT_SCALE_MAX = 300;
/** デフォルト文字倍率(%) */
export const FONT_SCALE_DEFAULT = 100;

/** 数値欄を有効な範囲に丸める。異常値は初期値にフォールバック */
function clampSize(
  value: unknown,
  min: number,
  max: number,
  defaultValue: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** 文字サイズを有効な範囲に丸める。異常値は初期値にフォールバック */
function clampFontSize(value: unknown): number {
  return clampSize(value, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT);
}

/** 文字倍率を有効な範囲に丸める。異常値は初期値にフォールバック */
function clampFontScale(value: unknown): number {
  return clampSize(value, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_DEFAULT);
}

/** 表示設定のAPI */
export type SettingsStore = SettingsStoreBase & {
  /** 全体文字サイズ */
  fontSize: number;
  /** 全体文字サイズを設定 */
  setFontSize(value: number): void;
  /** スレ内文字倍率 */
  fontScalePosts: number;
  /** スレ内文字倍率を設定 */
  setFontScalePosts(value: number): void;
  /** 宇宙モード（映画オープニング風クロール表示）を有効にする */
  spaceMode: boolean;
  /** 宇宙モードを設定 */
  setSpaceMode(value: boolean): void;
  /** ジュークボックス（共有音楽プレイヤー）を有効にする */
  jukeboxEnabled: boolean;
  /** ジュークボックスの有効/無効を設定 */
  setJukeboxEnabled(value: boolean): void;
  /** R18添付を常時表示する */
  showR18: boolean;
  setShowR18(value: boolean): void;
  ogpPreviewEnabled: boolean;
  setOgpPreviewEnabled(value: boolean): void;
  dragQuotePencilSize: "small" | "large";
  setDragQuotePencilSize(value: "small" | "large"): void;
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
        fontScalePosts: FONT_SCALE_DEFAULT,
        setFontScalePosts: (value: number) =>
          set({ fontScalePosts: clampFontScale(value) }),
        spaceMode: false,
        setSpaceMode: (spaceMode: boolean) => set({ spaceMode }),
        jukeboxEnabled: true,
        setJukeboxEnabled: (jukeboxEnabled: boolean) => set({ jukeboxEnabled }),
        showR18: false,
        setShowR18: (showR18: boolean) => set({ showR18 }),
        ogpPreviewEnabled: true,
        setOgpPreviewEnabled: (ogpPreviewEnabled: boolean) =>
          set({ ogpPreviewEnabled }),
        dragQuotePencilSize: "small",
        setDragQuotePencilSize: (dragQuotePencilSize: "small" | "large") =>
          set({ dragQuotePencilSize }),
        resetSettings(): void {
          base.resetSettings();
          set({
            fontSize: FONT_SIZE_DEFAULT,
            fontScalePosts: FONT_SCALE_DEFAULT,
            spaceMode: false,
            jukeboxEnabled: true,
            showR18: false,
            ogpPreviewEnabled: true,
            dragQuotePencilSize: "small",
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
  store.setFontSize(clampFontSize(store.fontSize));
  store.setFontScalePosts(clampFontScale(store.fontScalePosts));

  if (
    typeof localStorage !== "undefined" &&
    localStorage.getItem("aimg_legacy_thread_settings_migrated") !== "1"
  ) {
    const legacyOgp = localStorage.getItem("futaba_ogp_preview");
    const legacyPencil = localStorage.getItem("dragQuotePencilSize");
    if (legacyOgp !== null) store.setOgpPreviewEnabled(legacyOgp !== "0");
    if (legacyPencil !== null) {
      store.setDragQuotePencilSize(
        legacyPencil === "large" ? "large" : "small",
      );
    }
    localStorage.setItem("aimg_legacy_thread_settings_migrated", "1");
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
