import { useState } from "react";
import type { Thread } from "@/entities/thread";
import { PostForm } from "@/features/post/components/forms";
import { useSettingsStore } from "@/features/settings/hooks";

interface Props {
  thread: Thread;
  initialComment: string;
  openCount: number;
  onCloseComment: () => void;
  isArchived?: boolean;
}

/** 旧PC版の右側固定返信フォーム。フォーム本体は既存API連携を再利用する。 */
export const DesktopReplyPanel: React.FunctionComponent<Props> = ({
  thread,
  initialComment,
  openCount,
  onCloseComment,
  isArchived = false,
}: Props) => {
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);
  const collapsed = initialComment ? false : manuallyCollapsed;
  const deleteKey = useSettingsStore((state) => state.deleteKey);

  return (
    <aside
      className="desktop-floating-panel"
      data-kind="reply"
      data-collapsed={collapsed}
      aria-label="返信フォーム"
    >
      <button
        type="button"
        className="desktop-floating-tab"
        onClick={(): void => setManuallyCollapsed((value) => !value)}
        aria-expanded={!collapsed}
      >
        <span aria-hidden="true">▶</span>レス
      </button>
      <div className="desktop-floating-content">
        <div className="desktop-floating-heading">返信フォーム</div>
        <div className="desktop-floating-form">
          <div className="desktop-floating-field">
            <label htmlFor="desktop-act">ACT</label>
            <input id="desktop-act" value="sage" readOnly />
          </div>
          <div className="desktop-floating-field">
            <span className="desktop-floating-label">コメント</span>
            <span>本文を入力してください</span>
          </div>
          <div className="desktop-floating-field">
            <span className="desktop-floating-label">添付File</span>
            <span>画像・動画・お絵かき</span>
          </div>
          <div className="desktop-floating-field">
            <label htmlFor="desktop-delete-key">削除キー</label>
            <input
              id="desktop-delete-key"
              type="password"
              value={deleteKey || ""}
              readOnly
              placeholder="設定から入力"
            />
          </div>
          <div className="desktop-floating-field">
            <span className="desktop-floating-label">認証</span>
            <span>自動</span>
          </div>
          <PostForm
            threadId={thread.id}
            allowImageReplies={thread.allowImageReplies ?? true}
            closedAt={thread.closedAt}
            isArchived={isArchived}
            initialComment={initialComment}
            openCount={openCount}
            onSuccess={onCloseComment}
          />
        </div>
      </div>
    </aside>
  );
};
