import "altcha";
import "altcha/i18n/ja";
import "altcha/types/react";

import type { AltchaWidgetElement } from "altcha";
import {
  Fragment,
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  type AltchaCredential,
  type AltchaOperation,
  createAltchaChallengeController,
  getAltchaChallengePath,
} from "@/features/post/lib/altchaChallengeController";
import { API_BASE, getAimgToken } from "@/shared/api/client";
import { Button } from "@/shared/ui/form";

type AltchaState =
  | "error"
  | "expired"
  | "unverified"
  | "verified"
  | "verifying";

type AltchaEventDetail = {
  payload: string | null;
  state: AltchaState | "code";
};

type AltchaVerifiedDetail = {
  payload: string;
};

export type AltchaWidgetHandle = {
  getCredential: (signal?: AbortSignal) => Promise<AltchaCredential>;
  reset: () => void;
};

type Props = {
  operation: AltchaOperation;
};

const STATUS_MESSAGES: Record<AltchaState, string> = {
  error: "書き込み認証に失敗しました。再試行してください。",
  expired: "書き込み認証の期限が切れました。再試行してください。",
  unverified: "書き込み認証の準備ができています。",
  verified: "書き込み認証が完了しました。",
  verifying: "書き込み認証を確認中です。",
};

const noop = (): void => undefined;

export const AltchaWidget: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<AltchaWidgetHandle>
> = forwardRef<AltchaWidgetHandle, Props>(function AltchaWidget(
  { operation }: Props,
  ref,
): React.ReactElement {
  const labelId = useId();
  const descriptionId = useId();
  const widgetRef = useRef<AltchaWidgetElement | null>(null);
  const payloadRef = useRef<string | null>(null);
  const cleanupWidgetRef = useRef<() => void>(noop);
  const retryWhenReadyRef = useRef(false);
  const [controller] = useState(() =>
    createAltchaChallengeController({ getToken: getAimgToken }),
  );
  const [state, setState] = useState<AltchaState>("unverified");
  const [widgetGeneration, setWidgetGeneration] = useState(0);

  function reset(): void {
    // altcha@3.2.1 can emit a late `error` after reset aborts challenge fetch.
    // Detach the old host first, then mount a fresh host so the aborted
    // verification cannot overwrite the next form lifecycle's state.
    cleanupWidgetRef.current();
    cleanupWidgetRef.current = noop;
    retryWhenReadyRef.current = false;
    payloadRef.current = null;
    controller.reset();
    setState("unverified");
    setWidgetGeneration((generation) => generation + 1);
  }

  async function getCredential(
    signal?: AbortSignal,
  ): Promise<AltchaCredential> {
    signal?.throwIfAborted();
    const widget = widgetRef.current;
    if (!widget) {
      throw new Error("書き込み認証を読み込んでいます。もう一度お試しください");
    }
    if (widget.getState() === "verified" && payloadRef.current) {
      return controller.getCredential(payloadRef.current);
    }

    try {
      const result = await widget.verify();
      signal?.throwIfAborted();
      if (!result?.payload) {
        throw new Error("書き込み認証を完了できませんでした");
      }
      payloadRef.current = result.payload;
      return controller.getCredential(result.payload);
    } catch (error) {
      // ALTCHA may resolve null or reject with its own error after reset().
      // Preserve the form lifecycle's AbortError contract in that race.
      signal?.throwIfAborted();
      throw error;
    }
  }

  useImperativeHandle(ref, () => ({ getCredential, reset }));

  const attachWidget = useCallback(
    (element: HTMLElement | null): (() => void) | undefined => {
      if (!element) {
        widgetRef.current = null;
        return;
      }

      let active = true;
      let cleaned = false;
      let configuredWidget: AltchaWidgetElement | null = null;
      let removeListeners = (): void => undefined;

      const cleanup = (): void => {
        if (cleaned) return;
        cleaned = true;
        active = false;
        removeListeners();
        configuredWidget?.reset();
        controller.reset();
        payloadRef.current = null;
        if (widgetRef.current === configuredWidget) {
          widgetRef.current = null;
        }
      };
      cleanupWidgetRef.current = cleanup;

      const initialize = async (): Promise<void> => {
        await customElements.whenDefined("altcha-widget");
        // ALTCHA's Svelte custom element exposes methods after connectedCallback,
        // while Preact can invoke the ref callback just before that initialization.
        await Promise.resolve();
        if (!isAltchaWidgetElement(element)) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        }
        if (!active) return;
        if (!isAltchaWidgetElement(element)) {
          setState("error");
          return;
        }

        configuredWidget = element;
        widgetRef.current = element;
        const handleVerified = (event: Event): void => {
          if (!active) return;
          const detail = (event as CustomEvent<AltchaVerifiedDetail>).detail;
          payloadRef.current = detail.payload;
          setState("verified");
        };
        const handleStateChange = (event: Event): void => {
          if (!active) return;
          const detail = (event as CustomEvent<AltchaEventDetail>).detail;
          if (isAltchaState(detail.state)) {
            setState(detail.state);
          }
        };
        const handleExpired = (): void => {
          if (!active) return;
          payloadRef.current = null;
          setState("expired");
        };

        element.addEventListener("verified", handleVerified);
        element.addEventListener("statechange", handleStateChange);
        element.addEventListener("expired", handleExpired);
        removeListeners = (): void => {
          element.removeEventListener("verified", handleVerified);
          element.removeEventListener("statechange", handleStateChange);
          element.removeEventListener("expired", handleExpired);
        };
        await element.configure({
          auto: "off",
          challenge: getAltchaChallengePath(operation, API_BASE),
          display: "standard",
          fetch: controller.fetch,
          humanInteractionSignature: false,
          language: "ja",
          type: "checkbox",
          verifyUrl: null,
        });
        if (active && retryWhenReadyRef.current) {
          retryWhenReadyRef.current = false;
          void element.verify().catch(() => {
            if (active) setState("error");
          });
        }
      };

      void initialize().catch(() => {
        if (active) setState("error");
      });

      return () => {
        if (cleanupWidgetRef.current === cleanup) {
          cleanupWidgetRef.current = noop;
        }
        cleanup();
      };
    },
    [controller, operation],
  );

  const isFailure = state === "error" || state === "expired";

  return (
    <section
      className="altcha-widget-shell space-y-2 rounded-lg border border-border bg-card p-3"
      aria-labelledby={labelId}
    >
      <div>
        <p id={labelId} className="text-sm font-medium text-foreground">
          書き込み認証（ALTCHA）
        </p>
        <p id={descriptionId} className="text-xs text-muted-foreground">
          投稿時に端末上で短い確認処理を行います。
        </p>
      </div>
      <Fragment key={widgetGeneration}>
        <altcha-widget
          ref={attachWidget}
          className="altcha-widget-element"
          display="standard"
          type="checkbox"
          language="ja"
          name="altcha"
          aria-describedby={descriptionId}
        />
      </Fragment>
      <output aria-live="polite" aria-atomic="true" className="text-xs">
        {isFailure ? "" : STATUS_MESSAGES[state]}
      </output>
      {isFailure && (
        <div className="space-y-2">
          <p
            role="alert"
            aria-live="assertive"
            className="text-xs text-destructive"
          >
            {STATUS_MESSAGES[state]}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={(): void => {
              reset();
              retryWhenReadyRef.current = true;
            }}
            className="w-full"
          >
            認証を再試行
          </Button>
        </div>
      )}
    </section>
  );
});

function isAltchaWidgetElement(
  element: HTMLElement | null,
): element is AltchaWidgetElement {
  return (
    element !== null &&
    typeof Reflect.get(element, "verify") === "function" &&
    typeof Reflect.get(element, "configure") === "function"
  );
}

function isAltchaState(
  state: AltchaEventDetail["state"],
): state is AltchaState {
  return state in STATUS_MESSAGES;
}
