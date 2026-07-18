import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useHistoryThreads } from "@/features/history/hooks/useHistoryThreads";
import { useHistoryStore } from "@/features/history/stores/historyStore";

interface Config {
  width: number;
  sidebarLeft: boolean;
  visible: boolean;
  sortByNewRes: boolean;
}
const defaults: Config = {
  width: 320,
  sidebarLeft: true,
  visible: false,
  sortByNewRes: false,
};
function load(): Config {
  try {
    const raw = JSON.parse(
      localStorage.getItem("pc_sidebar_config") ?? "null",
    ) as Partial<Config> | null;
    return {
      ...defaults,
      ...raw,
      width: Math.max(250, Math.min(500, Number(raw?.width) || 320)),
    };
  } catch {
    return defaults;
  }
}
export function DesktopHistorySidebar(): React.ReactNode {
  const viewed = useHistoryStore((s) => s.viewed).slice(0, 50);
  const clear = useHistoryStore((s) => s.clearHistory);
  const unread = useHistoryStore((s) => s.getUnreadCount);
  const ids = viewed.map((item) => item.id);
  const query = useHistoryThreads("viewed", ids);
  const [config, setConfig] = useState(load);
  const update = (partial: Partial<Config>): void => {
    const next = { ...config, ...partial };
    setConfig(next);
    localStorage.setItem("pc_sidebar_config", JSON.stringify(next));
  };
  const threads = [...(query.data ?? [])].sort((a, b) =>
    config.sortByNewRes
      ? (unread(b.id, b.replyCount) ?? 0) - (unread(a.id, a.replyCount) ?? 0)
      : ids.indexOf(a.id) - ids.indexOf(b.id),
  );
  if (!config.visible)
    return (
      <button
        type="button"
        className="fixed right-0 top-1/2 z-40"
        onClick={() => update({ visible: true })}
      >
        見歴
      </button>
    );
  return (
    <aside
      aria-label="PC閲覧履歴"
      className="fixed top-0 bottom-0 z-50 overflow-auto border-border bg-background p-2 shadow-xl"
      style={{
        width: config.width,
        [config.sidebarLeft ? "left" : "right"]: 0,
      }}
    >
      <header className="flex flex-wrap gap-1">
        <b>見歴（最大50）</b>
        <button type="button" onClick={() => query.refetch()}>
          更新
        </button>
        <button
          type="button"
          aria-pressed={config.sortByNewRes}
          onClick={() => update({ sortByNewRes: !config.sortByNewRes })}
        >
          ▼新着
        </button>
        <button
          type="button"
          onClick={() => update({ sidebarLeft: !config.sidebarLeft })}
        >
          {config.sidebarLeft ? "右へ" : "左へ"}
        </button>
        <button type="button" onClick={clear}>
          全削除
        </button>
        <button type="button" onClick={() => update({ visible: false })}>
          閉じる
        </button>
      </header>
      <label>
        幅
        <input
          type="range"
          min="250"
          max="500"
          value={config.width}
          onChange={(event: React.ChangeEvent<HTMLInputElement>): void =>
            update({ width: Number(event.target.value) })
          }
        />
      </label>
      <ol>
        {threads.map((thread) => (
          <li key={thread.id} className="border-t py-2">
            <Link to="/thread/$threadId" params={{ threadId: thread.id }}>
              {thread.opPost.body.slice(0, 40) ||
                `No.${thread.opPost.boardNo ?? 0}`}
            </Link>
            {unread(thread.id, thread.replyCount) ? (
              <strong> +{unread(thread.id, thread.replyCount)}</strong>
            ) : null}
          </li>
        ))}
      </ol>
    </aside>
  );
}
