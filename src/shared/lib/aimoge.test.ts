import { describe, expect, test } from "bun:test";
import {
  type AimogeApi,
  createAimogeRuntime,
  initializeAimoge,
} from "@/shared/lib/aimoge";

describe("aimoge extension hooks", () => {
  test("data hooks form a value-transforming chain", () => {
    const runtime = createAimogeRuntime();
    const unregisterFirst = runtime.api.register("data:state", (value) => {
      const state = value as { count: number };
      return { count: state.count + 1 };
    });
    runtime.api.register("data:state", (value) => {
      const state = value as { count: number };
      return { count: state.count * 2 };
    });

    expect(runtime.transformData("data:state", { count: 1 })).toEqual({
      count: 4,
    });
    unregisterFirst();
    expect(runtime.transformData("data:state", { count: 1 })).toEqual({
      count: 2,
    });
  });

  test("a before hook can hide a value and later hooks remain isolated", () => {
    const runtime = createAimogeRuntime();
    runtime.api.register("post:beforeRender", () => {
      throw new Error("extension failure");
    });
    runtime.api.register("post:beforeRender", () => null);

    expect(runtime.beforeRender("post:beforeRender", { id: "post-1" })).toBe(
      null,
    );
  });

  test("rendered hooks all run even when one hook fails", () => {
    const runtime = createAimogeRuntime();
    const calls: string[] = [];
    runtime.api.register("post:rendered", () => {
      calls.push("first");
      throw new Error("extension failure");
    });
    runtime.api.register("post:rendered", (value) => {
      calls.push((value as { marker: string }).marker);
    });

    runtime.rendered("post:rendered", { marker: "second" });
    expect(calls).toEqual(["first", "second"]);
  });

  test("実行開始時のhook snapshotを使い実行中の登録解除は次回から反映する", () => {
    const runtime = createAimogeRuntime();
    const calls: string[] = [];
    let unregisterSecond = (): void => {};
    let registeredThird = false;

    runtime.api.register("data:state", (value) => {
      calls.push("first");
      unregisterSecond();
      if (!registeredThird) {
        registeredThird = true;
        runtime.api.register("data:state", (nextValue) => {
          calls.push("third");
          return nextValue;
        });
      }
      return value;
    });
    unregisterSecond = runtime.api.register("data:state", (value) => {
      calls.push("second");
      return value;
    });

    runtime.transformData("data:state", { id: 1 });
    expect(calls).toEqual(["first", "second"]);

    calls.length = 0;
    runtime.transformData("data:state", { id: 2 });
    expect(calls).toEqual(["first", "third"]);
  });

  test("registration generation changes and queued userscripts are drained", () => {
    const runtime = createAimogeRuntime();
    const generations: number[] = [runtime.getGeneration()];
    const queue = [
      (aimoge: { register: typeof runtime.api.register }): void => {
        aimoge.register("data:thread", (value) => value);
      },
    ];

    runtime.drainQueue(queue);
    generations.push(runtime.getGeneration());
    expect(runtime.api.version).toBe(1);
    expect(generations).toEqual([0, 1]);
    expect(runtime.transformData("data:thread", { id: "thread-1" })).toEqual({
      id: "thread-1",
    });
  });

  test("initializeAimoge drains window queue and dispatches ready", () => {
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const events: Event[] = [];
    let queuedApi: AimogeApi | undefined;
    const mockWindow: { aimoge?: AimogeApi; aimogeQueue: unknown[] } = {
      aimogeQueue: [
        (aimoge: AimogeApi): void => {
          queuedApi = aimoge;
          aimoge.register("data:thread", (value) => value);
        },
      ],
    };

    globalThis.window = mockWindow as unknown as Window & typeof globalThis;
    globalThis.document = {
      dispatchEvent: (event: Event): boolean => {
        events.push(event);
        return true;
      },
    } as unknown as Document;

    try {
      const api = initializeAimoge();
      expect(queuedApi).toBe(api);
      expect(mockWindow.aimoge).toBe(api);
      expect(mockWindow.aimogeQueue).toEqual([]);
      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("aimoge:ready");
      expect((events[0] as CustomEvent).detail.version).toBe(1);
    } finally {
      globalThis.window = originalWindow;
      globalThis.document = originalDocument;
    }
  });
});
