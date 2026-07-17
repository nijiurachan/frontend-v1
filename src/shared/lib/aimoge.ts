import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export const AIMOGE_VERSION = 1;
const SLOW_HOOK_WARN_MS = 50;

export const AIMOGE_HOOK_NAMES = [
  "data:thread",
  "data:catalog",
  "data:chunk",
  "data:state",
  "catalog:beforeRender",
  "catalog:rendered",
  "post:beforeRender",
  "post:rendered",
] as const;

export type AimogeHookName = (typeof AIMOGE_HOOK_NAMES)[number];
export type AimogeHookCallback = (value: unknown) => unknown;
export type AimogeQueueEntry = (aimoge: AimogeApi) => void;

export interface AimogeApi {
  readonly version: typeof AIMOGE_VERSION;
  register(name: AimogeHookName, callback: AimogeHookCallback): () => void;
}

export interface AimogeRuntime {
  readonly api: AimogeApi;
  getGeneration(): number;
  subscribe(listener: () => void): () => void;
  transformData<T>(name: AimogeHookName, value: T): T;
  beforeRender<T>(name: AimogeHookName, value: T): T | null;
  rendered(name: AimogeHookName, value: unknown): void;
  drainQueue(queue: readonly unknown[]): void;
}

type RegisteredHook = {
  id: number;
  callback: AimogeHookCallback;
};

export function createAimogeRuntime(): AimogeRuntime {
  const hooks = new Map<AimogeHookName, RegisteredHook[]>();
  const listeners = new Set<() => void>();
  let generation = 0;
  let nextHookId = 0;

  const notifyGenerationChange = (): void => {
    generation += 1;
    for (const listener of listeners) listener();
  };

  const register = (
    name: AimogeHookName,
    callback: AimogeHookCallback,
  ): (() => void) => {
    const registeredHook: RegisteredHook = { id: nextHookId, callback };
    nextHookId += 1;
    const registered = hooks.get(name) ?? [];
    registered.push(registeredHook);
    hooks.set(name, registered);
    notifyGenerationChange();

    return (): void => {
      const current = hooks.get(name);
      if (!current) return;
      const next = current.filter((hook) => hook.id !== registeredHook.id);
      if (next.length === current.length) return;
      if (next.length === 0) hooks.delete(name);
      else hooks.set(name, next);
      notifyGenerationChange();
    };
  };

  const api: AimogeApi = {
    version: AIMOGE_VERSION,
    register,
  };

  const invoke = (
    name: AimogeHookName,
    hook: RegisteredHook,
    value: unknown,
  ): unknown => {
    const startedAt = performance.now();
    try {
      return hook.callback(value);
    } catch (error) {
      console.warn(`[aimoge] hook ${name}#${hook.id} failed`, error);
      return undefined;
    } finally {
      const elapsedMs = performance.now() - startedAt;
      if (elapsedMs > SLOW_HOOK_WARN_MS) {
        console.warn(
          `[aimoge] slow hook ${name}#${hook.id}: ${elapsedMs.toFixed(1)}ms`,
        );
      }
    }
  };

  const getHooks = (name: AimogeHookName): RegisteredHook[] =>
    hooks.get(name) ?? [];

  return {
    api,
    getGeneration: (): number => generation,
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return (): void => {
        listeners.delete(listener);
      };
    },
    transformData: <T>(name: AimogeHookName, value: T): T => {
      let current: unknown = value;
      for (const hook of getHooks(name)) {
        const result = invoke(name, hook, current);
        if (result !== undefined) current = result;
      }
      return current as T;
    },
    beforeRender: <T>(name: AimogeHookName, value: T): T | null => {
      let current: unknown = value;
      for (const hook of getHooks(name)) {
        const result = invoke(name, hook, current);
        if (result === null) return null;
        if (result !== undefined) current = result;
      }
      return current as T;
    },
    rendered: (name: AimogeHookName, value: unknown): void => {
      for (const hook of getHooks(name)) invoke(name, hook, value);
    },
    drainQueue: (queue: readonly unknown[]): void => {
      for (const entry of queue) {
        if (typeof entry !== "function") {
          console.warn("[aimoge] ignored a non-function queue entry");
          continue;
        }
        try {
          entry(api);
        } catch (error) {
          console.warn("[aimoge] queued extension failed", error);
        }
      }
    },
  };
}

const runtime: AimogeRuntime = createAimogeRuntime();
let initialized = false;

export function initializeAimoge(): AimogeApi {
  if (initialized && window.aimoge) return window.aimoge;
  initialized = true;

  const queued = window.aimogeQueue ?? [];
  window.aimoge = runtime.api;
  window.aimogeQueue = [];
  runtime.drainQueue(queued);
  document.dispatchEvent(
    new CustomEvent("aimoge:ready", {
      detail: { aimoge: runtime.api, version: AIMOGE_VERSION },
    }),
  );
  return runtime.api;
}

export function runAimogeDataHook<T>(name: AimogeHookName, value: T): T {
  return runtime.transformData(name, value);
}

export function runAimogeBeforeRender<T>(
  name: "catalog:beforeRender" | "post:beforeRender",
  value: T,
): T | null {
  return runtime.beforeRender(name, value);
}

export function useAimogeHookGeneration(): number {
  return useSyncExternalStore(
    runtime.subscribe,
    runtime.getGeneration,
    runtime.getGeneration,
  );
}

export function useAimogeBeforeRender<T>(
  name: "catalog:beforeRender" | "post:beforeRender",
  value: T,
  alreadyPrepared: boolean = false,
): T | null {
  const generation = useAimogeHookGeneration();
  return useMemo(() => {
    void generation;
    return alreadyPrepared ? value : runAimogeBeforeRender(name, value);
  }, [alreadyPrepared, generation, name, value]);
}

export function useAimogeRendered(
  name: "catalog" | "post",
  value: unknown,
  threadId?: string,
): React.RefObject<HTMLDivElement | null> {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const didRenderRef = useRef(false);

  useEffect(() => {
    if (value == null) {
      didRenderRef.current = false;
      return;
    }
    const element = elementRef.current;
    if (!element || didRenderRef.current) return;

    const payload =
      name === "post"
        ? { post: value, element, threadId: threadId ?? "" }
        : { thread: value, element, threadId: threadId ?? "" };
    runtime.rendered(`${name}:rendered`, payload);
    didRenderRef.current = true;
  }, [name, threadId, value]);

  return elementRef;
}

declare global {
  interface Window {
    aimoge?: AimogeApi;
    aimogeQueue?: AimogeQueueEntry[];
  }
}
