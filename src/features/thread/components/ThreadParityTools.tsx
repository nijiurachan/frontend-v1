import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ThreadView } from "@/entities/thread";
import { useSettingsStore } from "@/features/settings/hooks";
import { useReplyModalStore } from "@/features/thread/stores/replyModalStore";
import { loadMlbSummary } from "@/features/thread/utils/mlbTracker";
import { createSelectionQuote } from "@/features/thread/utils/selectionQuote";
import {
  loadSpeechSettings,
  SPEECH_INITIAL_COOLDOWN_MS,
  SPEECH_SETTINGS_EVENT,
  type SpeechSettings,
  saveSpeechSettings,
  speakText,
} from "@/features/thread/utils/speech";
import {
  createThreadHtml,
  createThreadText,
  downloadAllAttachments,
  downloadBlob,
  threadExportBase,
} from "@/features/thread/utils/threadExport";
import { createThreadMetadata } from "@/features/thread/utils/threadMetadata";

export function ThreadMetadata({
  body,
  threadId,
}: {
  body: string;
  threadId: string;
}): React.ReactNode {
  const metadata = createThreadMetadata(body, threadId, location.origin);
  return (
    <>
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <link rel="canonical" href={metadata.canonical} />
      <meta property="og:title" content={metadata.title} />
      <meta property="og:description" content={metadata.description} />
      <meta property="og:url" content={metadata.canonical} />
    </>
  );
}

export function SelectionQuoteButton({
  root,
  disabled = false,
}: {
  root?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
}): React.ReactNode {
  const open = useReplyModalStore((state) => state.open);
  const size = useSettingsStore((state) => state.dragQuotePencilSize);
  const [selection, setSelection] = useState<{
    text: string;
    left: number;
    top: number;
  } | null>(null);
  useEffect(() => {
    if (disabled) return;
    const update = (): void => {
      setTimeout(() => {
        const selected = getSelection();
        const text = selected?.toString().trim() ?? "";
        if (!selected || !text || !selected.rangeCount) {
          setSelection(null);
          return;
        }
        const node =
          selected.anchorNode instanceof Element
            ? selected.anchorNode
            : selected.anchorNode?.parentElement;
        if (
          !node?.closest("blockquote,.rtd") ||
          (root?.current && !root.current.contains(node))
        ) {
          setSelection(null);
          return;
        }
        const rect = selected.getRangeAt(0).getBoundingClientRect();
        setSelection({
          text,
          left: rect.right + 6 + scrollX,
          top: rect.top + scrollY,
        });
      }, 10);
    };
    document.addEventListener("selectionchange", update);
    document.addEventListener("pointerup", update);
    document.addEventListener("keyup", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("pointerup", update);
      document.removeEventListener("keyup", update);
    };
  }, [disabled, root]);
  if (!selection) return null;
  return createPortal(
    <button
      type="button"
      aria-label="選択範囲を引用"
      style={{
        position: "absolute",
        zIndex: 60,
        left: selection.left,
        top: selection.top,
        fontSize: size === "large" ? 32 : 18,
        padding: size === "large" ? "6px 8px" : "2px 4px",
      }}
      onPointerDown={(event: React.PointerEvent<HTMLButtonElement>): void =>
        event.preventDefault()
      }
      onClick={() => {
        open(createSelectionQuote(selection.text));
        getSelection()?.removeAllRanges();
        setSelection(null);
      }}
    >
      ✎
    </button>,
    document.body,
  );
}

export function SpeechControls({
  threadId,
  posts,
  onAutoScroll,
}: {
  threadId: string;
  posts: ThreadView["posts"];
  onAutoScroll?: () => void;
}): React.ReactNode {
  const [settings, setSettings] = useState<SpeechSettings>(() =>
    loadSpeechSettings(localStorage),
  );
  const known = useRef<Set<string>>(new Set(posts.map((post) => post.id)));
  const initialized = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const controller = useRef<AbortController | null>(null);
  const enabled =
    settings.alwaysEnabled || settings.enabledThreadIds.includes(threadId);

  useEffect(() => {
    initialized.current = false;
    queue.current = Promise.resolve();
    controller.current?.abort();
    controller.current = new AbortController();
    const timer = setTimeout(() => {
      initialized.current = true;
    }, SPEECH_INITIAL_COOLDOWN_MS);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
    };
    // Existing posts at thread entry must never enter the speech queue.
  }, []);

  useEffect(() => {
    const reload = (): void => setSettings(loadSpeechSettings(localStorage));
    addEventListener(SPEECH_SETTINGS_EVENT, reload);
    return () => removeEventListener(SPEECH_SETTINGS_EVENT, reload);
  }, []);

  useEffect(() => {
    const fresh = posts.filter((post) => !known.current.has(post.id));
    fresh.forEach((post) => {
      known.current.add(post.id);
    });
    if (!initialized.current || fresh.length === 0) return;
    if (settings.autoScroll) onAutoScroll?.();
    if (!enabled) return;
    const signal = controller.current?.signal;
    fresh.forEach((post) => {
      queue.current = queue.current.then(() =>
        speakText(post.body, settings, fetch, signal).catch(() => undefined),
      );
    });
  }, [enabled, onAutoScroll, posts, settings]);
  const update = (next: SpeechSettings): void => {
    setSettings(next);
    saveSpeechSettings(localStorage, next);
  };
  const toggleThread = (): void =>
    update({
      ...settings,
      enabledThreadIds:
        enabled && !settings.alwaysEnabled
          ? settings.enabledThreadIds.filter((id) => id !== threadId)
          : [...new Set([...settings.enabledThreadIds, threadId])],
    });
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" aria-pressed={enabled} onClick={toggleThread}>
        読み上げ{enabled ? "ON" : "OFF"}
      </button>
      <select
        aria-label="読み上げ方式"
        value={settings.mode}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>): void =>
          update({
            ...settings,
            mode: event.target.value === "browser" ? "browser" : "bouyomi",
          })
        }
      >
        <option value="bouyomi">棒読みちゃん</option>
        <option value="browser">ブラウザ</option>
      </select>
    </span>
  );
}

export function ArchiveSaveActions({
  thread,
}: {
  thread: ThreadView;
}): React.ReactNode {
  const [error, setError] = useState("");
  const base = threadExportBase(thread);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob([createThreadHtml(thread)], {
              type: "text/html;charset=utf-8",
            }),
            `${base}.html`,
          )
        }
      >
        HTML保存
      </button>
      <button
        type="button"
        onClick={() =>
          downloadBlob(
            new Blob([createThreadText(thread)], {
              type: "text/plain;charset=utf-8",
            }),
            `${base}.txt`,
          )
        }
      >
        テキスト保存
      </button>
      <button
        type="button"
        onClick={() =>
          void downloadAllAttachments(thread).then((failures) =>
            setError(failures.length ? `${failures.length}件失敗` : ""),
          )
        }
      >
        全添付保存
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}

export function MlbTracker({
  legacyThreadId,
  fetcher = fetch,
}: {
  legacyThreadId?: number | null;
  fetcher?: typeof fetch;
}): React.ReactNode {
  const [message, setMessage] = useState("読み込み中...");
  useEffect(() => {
    if (legacyThreadId !== 5020) return;
    let active = true;
    let fetching = false;
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      if (fetching) return;
      fetching = true;
      try {
        const summary = await loadMlbSummary(
          fetcher,
          new Date(),
          controller.signal,
        );
        if (active) setMessage(summary);
      } catch {
        if (active && !controller.signal.aborted)
          setMessage("MLB API取得エラー");
      } finally {
        fetching = false;
      }
    };
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [fetcher, legacyThreadId]);
  return legacyThreadId === 5020 ? (
    <aside aria-label="MLB José Ramírez情報">{message}</aside>
  ) : null;
}
