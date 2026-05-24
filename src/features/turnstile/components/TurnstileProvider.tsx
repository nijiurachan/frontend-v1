import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";
import iconCloud from "@/assets/img/icon_cloud.webp";
import iconSuccess from "@/assets/img/icon_success.webp";
import { useReplyModalStore } from "@/features/thread/stores/replyModalStore";
import { useThreadCreateModalStore } from "@/features/thread/stores/threadCreateModalStore";
import { loadTurnstile, runWhenIdle } from "@/shared/lib";
import { TurnstileUnmountError } from "../lib/awaitTokenError";
import { useTurnstileModeStore } from "../stores/turnstileModeStore";
import {
  type TurnstileWidgetState,
  useTurnstileStore,
} from "../stores/turnstileStore";

const SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY;

// focusout 後の debounce (light mode の自動チャレンジトリガで連打を抑止する用途)
const FOCUSOUT_DEBOUNCE_MS = 150;
// error 状態のバックオフ
const ERROR_BACKOFF_MS = 5_000;
// 連続失敗 (error / expired) でこの回数を超えたら自動リトライを停止する。
// このサイトはブラウザを開いたまま就寝するユーザーが多く、無限リトライで
// CF と通信し続けるのを防ぐため。ユーザーが再認証ボタンを押すか、
// モーダルを開いた時点でカウンタはリセットされる
const MAX_AUTO_RETRIES = 3;

let mountedInstanceCount = 0;

export const TurnstileProvider: React.FunctionComponent = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const turnstileRef = useRef<Turnstile.Turnstile | undefined>(undefined);
  const renderingRef = useRef(false);
  const idleHandleRef = useRef<{ cancel: () => void } | null>(null);
  const errorTimerRef = useRef<number | null>(null);
  // 自動リトライ抑止のための連続失敗カウンタと前回 state / visible 追跡
  const failureCountRef = useRef(0);
  const prevStateRef = useRef<TurnstileWidgetState>("idle");
  const prevVisibleRef = useRef(false);
  // light mode 専用: フォームから focus が外れた瞬間にトークン未取得だった場合
  // だけ立つフラグ。一度自動チャレンジを許可するとクリアされる
  const lightTriggerArmedRef = useRef(false);
  // unmount 後に in-flight な loadTurnstile の .then が走っても render を
  // 実行しないようにするフラグ
  const unmountedRef = useRef(false);

  // widget の初期化 (load + render)。mount 時に一度呼ばれるほか、初回 load 失敗で
  // widget 不在のまま再認証ボタンが押された場合にも呼び出されて fresh load を
  // 試みる
  const initWidget = useCallback((): void => {
    if (!SITE_KEY) {
      if (import.meta.env.DEV) {
        console.error("[TurnstileProvider] VITE_TURNSTILE_SITE_KEY is not set");
      }
      // SITE_KEY 不在でも Provider が awaitToken をハングさせないよう error
      // 状態に遷移させる (本番では config 不備でしか起きない)
      useTurnstileStore.getState().setState("error");
      return;
    }
    const host = hostRef.current;
    if (!host) return;
    if (renderingRef.current || widgetIdRef.current) return;
    renderingRef.current = true;

    loadTurnstile()
      .then((turnstile) => {
        if (unmountedRef.current || !host.isConnected) {
          renderingRef.current = false;
          return;
        }
        turnstileRef.current = turnstile;
        try {
          const id = turnstile.render(host, {
            sitekey: SITE_KEY,
            size: "flexible",
            // appearance を 'always' に戻す (managed widget を常時表示)。
            // light mode のハング対策は appearance ではなく、自動 execute /
            // 自動再リトライを抑止する evaluator 側の gate (lightBlocksAuto) で行う。
            // 'always' でも iframe 描画タイミングで一瞬ちらつくため、下層の白パネル
            // (statusLabel) を引き続き残してちらつき緩和に使う
            appearance: "always",
            // render() で自動 challenge を起動させない。Provider のアイドル
            // スケジューラから明示的に execute() を呼ぶ
            execution: "execute",
            "refresh-expired": "manual",
            "refresh-timeout": "manual",
            retry: "never",
            callback: (token: string) => {
              useTurnstileStore.getState().setToken(token);
            },
            // CF state は session と独立に管理しているので、callback は
            // 素直に state を反映するだけ。session は別途 startSession /
            // clearSession で動かす。
            "expired-callback": () => {
              useTurnstileStore.getState().setState("expired");
            },
            "error-callback": () => {
              useTurnstileStore.getState().setState("error");
            },
            "before-interactive-callback": () => {
              useTurnstileStore.getState().setState("interaction-required");
            },
            "after-interactive-callback": () => {
              // 解決待ち。callback で token が来るので state は触らない
            },
          });
          widgetIdRef.current = id ?? undefined;
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error("[TurnstileProvider] render failed", err);
          }
          turnstileRef.current = undefined;
          widgetIdRef.current = undefined;
          useTurnstileStore.getState().setState("error");
        }
        renderingRef.current = false;
        // render 完了後、初回評価をキック (idle 取得を始める)
        useTurnstileStore.getState()._evaluate?.();
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) {
          console.error("[TurnstileProvider] script load failed", err);
        }
        // script ロード失敗。Provider を固着させずに error 状態に遷移して
        // ユーザーが再認証ボタンを押せば initWidget が再呼び出しされて retry される
        renderingRef.current = false;
        useTurnstileStore.getState().setState("error");
      });
  }, []);

  const handleResetClick = useCallback((): void => {
    // 手動リセットはユーザー意思なのでカウンタをクリア
    failureCountRef.current = 0;
    // light mode の自動チャレンジ抑止 gate を 1 回だけ通過させる。さもないと
    // requestRefresh → idle 遷移しても evaluator がブロックして widget が起動しない。
    // stable mode では gate 自体が無効なので、立てておいても無害。
    lightTriggerArmedRef.current = true;
    const turnstile = turnstileRef.current;
    const widgetId = widgetIdRef.current;
    if (!turnstile || !widgetId) {
      // load / render 未完了 (script load 失敗など)。fresh load を試みる。
      // loadTurnstile 側は失敗時にキャッシュをクリアするので再試行できる
      initWidget();
      return;
    }
    try {
      turnstile.reset(widgetId);
    } catch {
      // ignore
    }
    useTurnstileStore.getState().clearToken();
    useTurnstileStore.getState().requestRefresh();
  }, [initWidget]);

  // 開発環境での重複マウント検知 (HMR / StrictMode)
  useEffect(() => {
    mountedInstanceCount += 1;
    if (mountedInstanceCount > 1 && import.meta.env.DEV) {
      console.warn(
        "[TurnstileProvider] 複数インスタンスを検知しました。後発はスキップされます",
      );
    }
    return (): void => {
      mountedInstanceCount -= 1;
    };
  }, []);

  // mount 時の初期化 + unmount 時の cleanup
  useEffect(() => {
    unmountedRef.current = false;
    initWidget();

    return (): void => {
      unmountedRef.current = true;
      const turnstile = turnstileRef.current;
      const id = widgetIdRef.current;
      if (turnstile && id) {
        try {
          turnstile.remove(id);
        } catch {
          // 既に削除済み等は無視
        }
      }
      widgetIdRef.current = undefined;
      turnstileRef.current = undefined;
      renderingRef.current = false;
      idleHandleRef.current?.cancel();
      idleHandleRef.current = null;
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
      // 待機中の awaitToken を終了
      useTurnstileStore.getState()._rejectPending(new TurnstileUnmountError());
    };
  }, [initWidget]);

  // 評価関数の登録 (state machine)
  useEffect(() => {
    const evaluate = (): void => {
      const turnstile = turnstileRef.current;
      const widgetId = widgetIdRef.current;
      if (!turnstile || !widgetId) return;
      // mode の hydration (cookie 読込) が終わるまでは評価しない。デフォルト
      // mode は非 iOS で "stable" なので、ここを通すと light mode のユーザーでも
      // 一瞬 stable とみなされ auto challenge がスケジュールされてしまう
      // (その後 mode が light に直っても scheduled な execute は走る)。
      // hydrate 完了時に mode-store の subscribe 経由で再キックされる。
      if (!useTurnstileModeStore.getState().hydrated) return;

      const store = useTurnstileStore.getState();
      const refreshRequested = store._consumeRefreshRequest();

      // refreshRequested は最優先。pending/ready 中なら reset、token もクリア。
      // ユーザー意思の手動リトライなのでこの経路ではカウンタ増減はスキップする。
      // 状態が既に idle のときも fall-through で switch idle 経路に入り再 prefetch
      // させる (idleHandleRef で二重スケジュールは防がれる)
      if (refreshRequested) {
        if (store.state === "pending" || store.state === "ready") {
          try {
            turnstile.reset(widgetId);
          } catch {
            // ignore
          }
        }
        // 古い token を残さない (awaitToken が誤って返さないように)
        store.clearToken();
        if (store.state !== "idle") {
          store.setState("idle");
          // setState は evaluate を再帰呼び出しするので、こちらの outer は終了
          return;
        }
      }

      // ---- 自動リトライカウンタの更新 (state / visible 遷移検知) ----
      // 成功 (=ready 入り) でカウンタをクリア
      if (store.state === "ready" && prevStateRef.current !== "ready") {
        failureCountRef.current = 0;
      }
      // 失敗 (error / expired への遷移) で +1
      if (
        (store.state === "error" || store.state === "expired") &&
        prevStateRef.current !== store.state
      ) {
        failureCountRef.current += 1;
      }
      // モーダル開く瞬間 (visible false→true) はユーザー意思なのでカウンタクリア
      if (store.visible && !prevVisibleRef.current) {
        failureCountRef.current = 0;
      }
      prevStateRef.current = store.state;
      prevVisibleRef.current = store.visible;

      // 自動リトライを抑止する条件: 連続失敗が上限到達 かつ awaitToken 待機者なし。
      // 待機者がいるときは「ユーザーが今まさに submit している」ので試行する
      const exhaustedAutoRetry =
        failureCountRef.current >= MAX_AUTO_RETRIES && store._pending === null;

      // light mode 専用: 自動チャレンジを抑止する gate。
      // _pending (=submit 待機) または lightTriggerArmedRef (=focusout で意思表示)
      // のどちらかが立っていない限り、idle 経路から自動で execute へ進ませない
      // (タブハング対策)。expired / error は widget reset まで進めるが、その後の
      // idle 経路でこの gate により execute が抑止される。
      const mode = useTurnstileModeStore.getState().mode;
      const lightBlocksAuto =
        mode === "light" &&
        store._pending === null &&
        !lightTriggerArmedRef.current;

      switch (store.state) {
        case "idle": {
          // token 既保持時は state==='ready' なのでここには来ない
          if (lightBlocksAuto) {
            // auto challenge が抑止される状態 (light mode で armed でない) に
            // なったら、stable→light 切替や hydrate race で既にスケジュール
            // 済みの execute があれば取り消す
            idleHandleRef.current?.cancel();
            idleHandleRef.current = null;
            return;
          }
          if (idleHandleRef.current) return; // 既にスケジュール済み
          // 即時必要 (submit 待機者 / light mode の focusout トリガ) なら短い timeout
          const useImmediate =
            store._pending !== null || lightTriggerArmedRef.current;
          idleHandleRef.current = runWhenIdle(
            () => {
              idleHandleRef.current = null;
              const cur = useTurnstileStore.getState();
              if (cur.state !== "idle") return;
              try {
                turnstile.execute(widgetId);
                // 実起動できた時点で light mode のワンショットフラグを消費する
                lightTriggerArmedRef.current = false;
                cur.setState("pending");
              } catch {
                cur.setState("error");
              }
            },
            { timeout: useImmediate ? 50 : 2_000 },
          );
          return;
        }
        case "pending":
          // 進行中チャレンジは中断しない
          return;
        case "ready":
          // 何もしない。consumeToken 呼ばれるまで保持
          return;
        case "expired": {
          // 両 mode とも widget は pre-execute まで戻して背後パネルを映せるように
          // する (token 破棄 + reset + idle 遷移)。
          store.clearToken();
          if (exhaustedAutoRetry) return;
          try {
            turnstile.reset(widgetId);
          } catch {
            // ignore
          }
          store.setState("idle");
          return;
        }
        case "error": {
          // expired と同様、両 mode とも widget reset まで進める。違いは
          // ERROR_BACKOFF_MS の遅延を挟むこと (連発エラー時の連打防止)。
          store.clearToken();
          if (exhaustedAutoRetry) return;
          if (errorTimerRef.current !== null) return;
          errorTimerRef.current = window.setTimeout(() => {
            errorTimerRef.current = null;
            const cur = useTurnstileStore.getState();
            if (cur.state !== "error") return;
            try {
              turnstile.reset(widgetId);
            } catch {
              // ignore
            }
            cur.setState("idle");
          }, ERROR_BACKOFF_MS);
          return;
        }
        case "interaction-required":
          // ユーザー操作待ち。何もしない
          return;
      }
    };

    return useTurnstileStore.getState().registerEvaluator(evaluate);
  }, []);

  // light mode 専用: フォームから focus が抜けた瞬間に「次回 submit までに
  // challenge を開始しておく必要があるか」を判定し、必要なら一度だけ自動
  // チャレンジを許可する。stable mode では関係なし (idle 経路で常時自動
  // チャレンジするため、mode を毎回ハンドラ内で読んで早期 return する)。
  useEffect(() => {
    let focusTimer: number | null = null;

    type FormKind = "reply" | "thread" | null;
    const getFormKind = (target: EventTarget | null): FormKind => {
      if (!(target instanceof HTMLElement)) return null;
      if (
        !target.matches(
          'input,textarea,[contenteditable=""],[contenteditable="true"]',
        )
      ) {
        return null;
      }
      const form = target.closest("[data-turnstile-target-form]");
      if (!form) return null;
      const kind = form.getAttribute("data-turnstile-target-form");
      return kind === "reply" || kind === "thread" ? kind : null;
    };

    // CF state + hasSession から、focusout で challenge を開始すべきか判定する。
    //   - CF state が idle/expired/error 以外: 既に進行中 (pending) または完了
    //     (ready) または対話待ち (interaction-required) なので何もしない
    //   - reply: hasSession が true なら不要 (session で submit できる)
    //   - thread: session に関係なく state 条件のみで判定 (毎回 fresh token 必須)
    const shouldStartChallengeOnFocusOut = (
      kind: "reply" | "thread",
    ): boolean => {
      const cur = useTurnstileStore.getState();
      if (
        cur.state !== "idle" &&
        cur.state !== "expired" &&
        cur.state !== "error"
      ) {
        return false;
      }
      if (kind === "reply" && cur.hasSession) {
        return false;
      }
      return true;
    };

    const handleFocusOut = (e: FocusEvent): void => {
      // stable mode 時は idle 経路で常時自動チャレンジするので、focusout 駆動は
      // 不要 (むしろ重複起動を招く)
      if (useTurnstileModeStore.getState().mode !== "light") return;
      const originKind = getFormKind(e.target);
      if (!originKind) return;
      if (focusTimer !== null) window.clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        focusTimer = null;
        // フォーム内の別入力に focus が移っただけなら、まだ入力中とみなして
        // 自動チャレンジを起動しない (light mode で typing 中に execute が走るとハングする)
        if (getFormKind(document.activeElement) !== null) return;
        if (!shouldStartChallengeOnFocusOut(originKind)) return;
        // ワンショットトリガを立てて evaluator をキック。idle/expired/error の
        // どれであっても各 case が widget reset を扱い、最終的に idle case で
        // execute() がスケジュールされる (lightBlocksAuto は armed=true で抜ける)。
        lightTriggerArmedRef.current = true;
        useTurnstileStore.getState()._evaluate?.();
      }, FOCUSOUT_DEBOUNCE_MS);
    };

    document.addEventListener("focusout", handleFocusOut, true);
    return (): void => {
      document.removeEventListener("focusout", handleFocusOut, true);
      if (focusTimer !== null) window.clearTimeout(focusTimer);
    };
  }, []);

  // light mode 専用: スレ立てモーダルが open された瞬間、hasSession を落とす。
  // スレ立ては毎回 fresh token 必須なので、reply 用に立っていた session で
  // bypass されては困る。widget の状態は触らない (token が ready のまま残って
  // いれば、そのままスレ立てに使える)。stable mode では hasSession を参照しない
  // ので、現状の自動更新挙動には影響しない (条件を絞っているのは無駄な書き込み
  // を避けるためで、絞らなくても挙動上の差は無い)。
  useEffect(() => {
    let prevOpen = useThreadCreateModalStore.getState().isOpen;
    const unsub = useThreadCreateModalStore.subscribe((state) => {
      const opened = !prevOpen && state.isOpen;
      prevOpen = state.isOpen;
      if (!opened) return;
      if (useTurnstileModeStore.getState().mode !== "light") return;
      useTurnstileStore.getState().clearSession();
    });
    return unsub;
  }, []);

  // mode が切り替わったら evaluator を再キックする。stable → light で停止すべき
  // 自動チャレンジが残っていれば setState を介さない gate 反映で抑止が効くし、
  // light → stable では blocked のまま idle で止まっている状態から再開する。
  useEffect(() => {
    const unsub = useTurnstileModeStore.subscribe(() => {
      useTurnstileStore.getState()._evaluate?.();
    });
    return unsub;
  }, []);

  // mount 時に cookie からモードを読みこむ
  useEffect(() => {
    void useTurnstileModeStore.getState().hydrate();
  }, []);

  // モーダル可視性購読 → visible に集約
  useEffect(() => {
    const update = (): void => {
      const replyOpen = useReplyModalStore.getState().isOpen;
      const threadCreateOpen = useThreadCreateModalStore.getState().isOpen;
      useTurnstileStore.getState().setVisible(replyOpen || threadCreateOpen);
    };
    update();
    const unsubReply = useReplyModalStore.subscribe(update);
    const unsubThread = useThreadCreateModalStore.subscribe(update);
    return (): void => {
      unsubReply();
      unsubThread();
    };
  }, []);

  // Provider DOM: PostForm / ThreadCreateForm のモーダル表示と連動して
  // 上端からスライドインする。widget 本体 (flex-1) + 65px のリセットボタン。
  // モード切替は設定ページの「その他」タブから行う。
  // appearance: 'always' なので大半の時間は iframe が下層パネルを覆うが、
  // iframe 描画タイミングのちらつき低減のため白パネルを残してある。
  const visible = useTurnstileStore((s) => s.visible);
  const widgetState = useTurnstileStore((s) => s.state);
  const hasSession = useTurnstileStore((s) => s.hasSession);
  const mode = useTurnstileModeStore((s) => s.mode);
  const hydrated = useTurnstileModeStore((s) => s.hydrated);
  // 背後パネル (idle = pre-execute / 認証なし) の表示。
  const statusLabel = ((): string | null => {
    if (widgetState !== "idle") return null;
    if (mode !== "light") return null;
    if (hasSession) return "success";
    return "idle";
  })();

  // cookie からのモード読み込みが終わるまで widget を出さない。hydrate 完了前に
  // 評価器が走ると、デフォルト mode で意図しない自動チャレンジが起きうるため。
  const effectivelyVisible = visible && hydrated;

  return (
    <motion.div
      // 行高をリセットボタンと同じ 65px に固定。Turnstile iframe が
      // 一瞬高さを押し広げてもボタンと縦が揃ったままになる
      className="fixed inset-x-0 top-0 z-[200] flex items-stretch h-[65px]"
      initial={false}
      animate={{ y: effectivelyVisible ? "0%" : "-100%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ pointerEvents: effectivelyVisible ? "auto" : "none" }}
      aria-hidden={!effectivelyVisible}
    >
      <div className="relative flex-1 min-w-0 overflow-hidden">
        {/* 下層: 常時白パネル。ちらつき防止のため suspended 条件は付けない。
            Turnstile widget は CF の仕様で常に白背景 / 黒系テキスト固定なので、
            テーマセマンティックカラーではなく白 + 薄灰の literal カラーで揃える */}
        <div
          className="absolute inset-0 bg-white flex items-center px-1 pointer-events-none select-none"
          aria-hidden="true"
        >
          {statusLabel === null ? null : (
            <>
              {statusLabel === "success" && (
                <img
                  src={iconSuccess}
                  alt=""
                  className="h-[55px] w-auto flex-shrink-0 object-contain"
                />
              )}
              <span className="text-gray-700 text-sm px-2 text-left flex-shrink min-w-0 opacity-70 leading-tight">
                {statusLabel === "success" ? (
                  <>
                    <span className="block text-lg">しばらく投稿できます</span>
                    <span className="block text-sm ml-1">
                      エラーが出たら右のボタンで認証
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block text-lg">⌛️ 認証が必要です</span>
                    <span className="block text-sm ml-8">
                      文章入力後に自動認証します
                    </span>
                  </>
                )}
              </span>
              <img
                src={iconCloud}
                alt=""
                className="h-[30px] w-auto ml-auto flex-shrink-0 object-contain"
              />
            </>
          )}
        </div>
        {/* 上層: widget host。appearance: 'always' なので render 完了後は
            おおむね iframe が常時パネルテキストを覆い、iframe 描画ちらつき時のみ
            下層が見える */}
        <div ref={hostRef} className="relative w-full h-full" />
      </div>
      <button
        type="button"
        onClick={handleResetClick}
        aria-label="Turnstile を再認証"
        // 非表示時はキーボードフォーカス対象から外す。クリックは pointer-events:
        // none で既にブロック済み
        tabIndex={effectivelyVisible ? 0 : -1}
        disabled={!effectivelyVisible}
        className="w-[65px] h-[65px] flex-shrink-0 flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:cursor-not-allowed"
      >
        <FiRefreshCw size={20} aria-hidden="true" />
      </button>
    </motion.div>
  );
};
