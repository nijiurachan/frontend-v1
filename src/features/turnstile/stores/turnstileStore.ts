import { create, type StoreApi, type UseBoundStore } from "zustand";
import { TurnstileTimeoutError } from "../lib/awaitTokenError";
import { shouldReviveSession } from "../lib/lastTokenUsage";

export type TurnstileWidgetState =
  | "idle"
  | "pending"
  | "ready"
  | "expired"
  | "error"
  | "interaction-required";

interface PendingResolver {
  promise: Promise<string>;
  resolve: (token: string) => void;
  reject: (error: Error) => void;
  timer: number;
}

interface TurnstileStore {
  /**
   * 直近の Turnstile challenge で得た token。consumeToken で消費 / clearToken
   * で破棄するまで保持される。state==='ready' のときだけ有効。
   */
  token: string | null;
  issuedAt: number | null;
  /**
   * バックエンドの「投稿 1 回以降は token 不要」セッションが有効かどうか。
   * 投稿成功 (post / thread create) で true、新スレ立てモーダル open
   * (light mode 時) で false に戻る。アクティブ中は時間管理しない bool
   * (バックエンド側が真の失効を判定するため、フロント予測は不正確になりがち
   * だった経緯から簡略化)。
   *
   * 例外: フルリロード / 他サイト経由で in-memory 値が失われるので、起動時のみ
   * `lastTokenUsage` の記録が SESSION_REVIVAL_WINDOW_MS (30 分) 以内なら true で
   * 復活させる (shouldReviveSession())。
   *
   * light mode のときだけ参照される。stable mode 時は無視され、常に
   * 新規 token を取得する挙動になる。
   */
  hasSession: boolean;
  /**
   * Turnstile widget の純粋な CF 状態。session とは独立。
   */
  state: TurnstileWidgetState;
  visible: boolean;

  /** Provider が登録する評価関数。各 action の最後に呼ばれる */
  _evaluate: (() => void) | null;
  /** awaitToken の保留中 Promise。setToken or unmount で resolve/reject */
  _pending: PendingResolver | null;

  setState: (s: TurnstileWidgetState) => void;
  setToken: (t: string) => void;
  /**
   * token / issuedAt をクリアする (state も session も触らない)。expired /
   * refresh 経路で widget を reset した直後に呼んで、awaitToken が古い
   * トークンを返さないようにする
   */
  clearToken: () => void;
  consumeToken: () => string | null;
  /** 投稿成功 (post / thread create) 時に呼ぶ。light mode のみ参照される。 */
  startSession: () => void;
  /** 新スレ立てモーダル open 時に呼ぶ (light mode で fresh token 要求のため)。 */
  clearSession: () => void;
  requestRefresh: () => void;
  setVisible: (v: boolean) => void;
  registerEvaluator: (evaluate: () => void) => () => void;
  awaitToken: (timeoutMs?: number) => Promise<string>;
  /** Provider unmount 時の保留 Promise クリア */
  _rejectPending: (error: Error) => void;
  /** requestRefresh によって reset を要求されたかのフラグ */
  _refreshRequested: boolean;
  _consumeRefreshRequest: () => boolean;
}

function evaluate(get: () => TurnstileStore): void {
  get()._evaluate?.();
}

export const useTurnstileStore: UseBoundStore<StoreApi<TurnstileStore>> =
  create<TurnstileStore>((set, get) => ({
    token: null,
    issuedAt: null,
    // フルリロード後でも直近 30 分以内に token を使っていれば session を復活
    hasSession: shouldReviveSession(),
    state: "idle",
    visible: false,
    _evaluate: null,
    _pending: null,
    _refreshRequested: false,

    setState: (s: TurnstileWidgetState): void => {
      if (get().state === s) return;
      set({ state: s });
      evaluate(get);
    },

    setToken: (token: string): void => {
      // CF challenge で取れた新規 token。session とは独立なので hasSession には触らない。
      set({ token, issuedAt: Date.now(), state: "ready" });
      const pending = get()._pending;
      if (pending) {
        window.clearTimeout(pending.timer);
        pending.resolve(token);
        set({ _pending: null });
      }
      evaluate(get);
    },

    clearToken: (): void => {
      const { token, issuedAt } = get();
      if (!token && issuedAt === null) return;
      set({ token: null, issuedAt: null });
      // state は呼び出し元で別途管理する (awaitToken 待機者には影響を与えない)
      // session も触らない
    },

    consumeToken: (): string | null => {
      const { token } = get();
      if (!token) return null;
      // === state を直接 idle にしない設計の理由 ===
      // この関数は token を破棄するだけでなく widget の visual reset
      // (turnstile.reset()) も伴う必要がある。reset() は Provider 側が
      // widget ID を握っているので、ここから直接呼べない。
      //
      // そこで「state は ready のまま」「_refreshRequested を立てる」
      // 「evaluate を発火させる」の 3 点だけを行い、残りの処理を Provider の
      // evaluator に委ねる。evaluator の refresh handler は state===ready の
      // ときだけ turnstile.reset() を呼ぶ仕様なので、state を先に idle に
      // 変えてしまうと reset() が走らず widget が前回の ✅ 表示のまま固着する。
      //
      // 実際の state 遷移シーケンス:
      //   1. ここで _refreshRequested=true (state は ready のまま)
      //   2. evaluator: refresh handler が turnstile.reset() を実行
      //   3. evaluator: clearToken (このメソッドで既に null 化済み, no-op)
      //   4. evaluator: setState("idle") → 再帰 evaluate
      //   5. 再帰 evaluator: idle case で execute をスケジュール (stable mode のみ;
      //      light mode は lightBlocksAuto で停止し focusout/submit 待ち)
      //
      // hasSession には一切触らない。session 開始は form 側で startSession() を
      // 呼んで明示的に行う。
      set({
        token: null,
        issuedAt: null,
        _refreshRequested: true,
      });
      evaluate(get);
      return token;
    },

    startSession: (): void => {
      set({ hasSession: true });
    },

    clearSession: (): void => {
      set({ hasSession: false });
    },

    requestRefresh: (): void => {
      set({ _refreshRequested: true });
      evaluate(get);
    },

    _consumeRefreshRequest: (): boolean => {
      const requested = get()._refreshRequested;
      if (requested) set({ _refreshRequested: false });
      return requested;
    },

    setVisible: (v: boolean): void => {
      if (get().visible === v) return;
      set({ visible: v });
      evaluate(get);
    },

    registerEvaluator: (fn: () => void): (() => void) => {
      set({ _evaluate: fn });
      // 登録直後にも評価を走らせる
      fn();
      return (): void => {
        if (get()._evaluate === fn) {
          set({ _evaluate: null });
        }
      };
    },

    awaitToken: (timeoutMs: number = 30_000): Promise<string> => {
      // state === 'ready' を要件に含める。expired/error などで token フィールドが
      // 残っているケースでも誤って古い token を返さないようにする
      const { token, state } = get();
      if (token && state === "ready") return Promise.resolve(token);

      const pending = get()._pending;
      if (pending) return pending.promise;

      let resolveFn!: (token: string) => void;
      let rejectFn!: (error: Error) => void;
      const promise = new Promise<string>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
      const timer = window.setTimeout(() => {
        const cur = get()._pending;
        if (cur && cur.promise === promise) {
          set({ _pending: null });
          rejectFn(new TurnstileTimeoutError());
        }
      }, timeoutMs);
      set({
        _pending: { promise, resolve: resolveFn, reject: rejectFn, timer },
      });
      // 待機開始を Provider に伝える
      evaluate(get);
      return promise;
    },

    _rejectPending: (error: Error): void => {
      const pending = get()._pending;
      if (!pending) return;
      window.clearTimeout(pending.timer);
      pending.reject(error);
      set({ _pending: null });
    },
  }));
