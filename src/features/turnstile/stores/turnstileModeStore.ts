import { create, type StoreApi, type UseBoundStore } from "zustand";
import { isIOS } from "../lib/isIOS";

/**
 * Turnstile の動作モード。
 *   - "stable": 旧 非 iOS 挙動。hasSession を無視し自動更新を回し続ける。
 *   - "light":  旧 iOS 挙動。focusout までは自動チャレンジを抑止し、hasSession
 *               が立っているなら token なしでも投稿を試みる。
 */
export type TurnstileMode = "light" | "stable";

const COOKIE_NAME: string = "aimg-turnstile-mode";
const COOKIE_MAX_AGE_MS: number = 365 * 24 * 60 * 60 * 1000;

interface TurnstileModeStore {
  mode: TurnstileMode;
  /** cookie からの初期値読込が終わったら true。Provider はこれを待ってから表示する */
  hydrated: boolean;
  setMode: (mode: TurnstileMode) => void;
  /** mount 時に呼び、cookie からモードを読みこむ。cookie 不在ならデフォルトを書き込む */
  hydrate: () => Promise<void>;
}

function defaultMode(): TurnstileMode {
  return isIOS ? "light" : "stable";
}

function isValidMode(v: string | undefined | null): v is TurnstileMode {
  return v === "light" || v === "stable";
}

async function writeCookie(mode: TurnstileMode): Promise<void> {
  try {
    await cookieStore.set({
      name: COOKIE_NAME,
      value: mode,
      expires: Date.now() + COOKIE_MAX_AGE_MS,
      sameSite: "lax",
      path: "/",
    });
  } catch {
    // cookieStore 未対応 / 書込失敗時は黙ってフォールバック。state は更新済み。
  }
}

export const useTurnstileModeStore: UseBoundStore<
  StoreApi<TurnstileModeStore>
> = create<TurnstileModeStore>((set, get) => ({
  mode: defaultMode(),
  hydrated: false,
  setMode: (mode: TurnstileMode): void => {
    if (get().mode === mode) return;
    set({ mode });
    void writeCookie(mode);
  },
  hydrate: async (): Promise<void> => {
    if (get().hydrated) return;
    try {
      const entry = await cookieStore.get(COOKIE_NAME);
      const v = entry?.value;
      if (isValidMode(v)) {
        set({ mode: v, hydrated: true });
        return;
      }
      const d = defaultMode();
      set({ mode: d, hydrated: true });
      void writeCookie(d);
    } catch {
      set({ hydrated: true });
    }
  },
}));
