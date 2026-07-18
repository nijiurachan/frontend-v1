import type { ComponentType } from "react";
import {
  FiArrowLeft,
  FiFlag,
  FiHash,
  FiImage,
  FiSlash,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";

export interface PostActionItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

export interface PostActionPost {
  seq: number;
  delCount?: number | null;
  attachment?: { ngHash: string | null; originalUrl?: string } | null;
}

export interface PostActionHandlers {
  onReply: (type: "body" | "no" | "filename") => void;
  onSoudane: () => void;
  onDelete: () => void;
  onDel: () => void;
  onNgBody: () => void;
  onNgImage: () => void;
  onReport: () => void;
  onCloseThread: () => void;
}

export function createPostActionItems(
  isArchived: boolean,
  post: PostActionPost,
  handlers: PostActionHandlers,
): PostActionItem[] {
  const reportAction: PostActionItem = {
    icon: FiFlag,
    label: "通報",
    onClick: handlers.onReport,
  };
  const ngAction: PostActionItem = {
    icon: FiSlash,
    label: "本文NG",
    variant: "destructive",
    onClick: handlers.onNgBody,
  };
  const imageNgAction: PostActionItem | null = post.attachment?.ngHash
    ? {
        icon: FiImage,
        label: "画像をNG",
        variant: "destructive",
        onClick: handlers.onNgImage,
      }
    : null;
  const actions: PostActionItem[] = isArchived
    ? [ngAction, ...(imageNgAction ? [imageNgAction] : []), reportAction]
    : [
        {
          icon: FiArrowLeft,
          label: "本文返信",
          onClick: (): void => handlers.onReply("body"),
        },
        {
          icon: FiHash,
          label: "No返信",
          onClick: (): void => handlers.onReply("no"),
        },
        ...(post.attachment
          ? [
              {
                icon: FiImage,
                label: "画像ファイル名を引用",
                onClick: (): void => handlers.onReply("filename"),
              },
            ]
          : []),
        {
          icon: FiThumbsUp,
          label: "そうだね",
          onClick: handlers.onSoudane,
        },
        {
          icon: FiTrash2,
          label: "削除",
          variant: "destructive",
          onClick: handlers.onDelete,
        },
        ngAction,
        ...(imageNgAction ? [imageNgAction] : []),
        {
          icon: FiThumbsDown,
          label: post.delCount == null ? "del" : `del (${post.delCount})`,
          variant: "destructive",
          onClick: handlers.onDel,
        },
      ];

  if (!isArchived && post.seq === 0) {
    actions.push({
      icon: FiTrash2,
      label: "スレを閉じる",
      variant: "destructive",
      onClick: handlers.onCloseThread,
    });
  }

  return actions;
}
