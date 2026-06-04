import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Attachment } from "@/entities/attachment";
import type { Post } from "@/entities/post";
import type { Thread } from "@/entities/thread";
import { getThreadTitle } from "@/entities/thread";

interface NgState {
  enabled: boolean;
  showNgContent: boolean;
  hiddenThreadIds: number[];
  ngDisplayIds: string[];
  ngTitles: string[];
  ngWords: string[];
  ngRegexes: string[];
  ngImages: string[]; // ビット文字列で保持

  setEnabled: (enabled: boolean) => void;
  setShowNgContent: (show: boolean) => void;
  hideThread: (id: number) => void;
  unhideThread: (id: number) => void;
  addNgDisplayId: (displayId: string) => void;
  removeNgDisplayId: (displayId: string) => void;
  addNgTitle: (title: string) => void;
  removeNgTitle: (title: string) => void;
  addNgWord: (word: string) => void;
  removeNgWord: (word: string) => void;
  addNgRegex: (regex: string) => void;
  removeNgRegex: (regex: string) => void;
  addNgImage: (input: string) => void;
  removeNgImage: (bits: string) => void;

  isThreadHidden: (thread: Thread) => boolean;
  isPostHidden: (post: Post) => boolean;
  clearAllNgSettings: () => void;
}

// ─── 外部から呼び出し可能なヘルパー関数 ───
/** Attachmentから画像NGに追加（コンポーネント外からも利用可能） */
export function addNgImageFromAttachment(attachment: Attachment): void {
  if (attachment.ng_hash) {
    useNgStore.getState().addNgImage(attachment.ng_hash);
  }
}

// NG処理本体 useNgStore
export const useNgStore: UseBoundStore<StoreApi<NgState>> = create<NgState>()(
  persist(
    (set, get) => ({
      enabled: true,
      showNgContent: false,
      hiddenThreadIds: [],
      ngDisplayIds: [],
      ngTitles: [],
      ngWords: [],
      ngRegexes: [],
      ngImages: [],

      setEnabled: (enabled: boolean) => set({ enabled }),
      setShowNgContent: (showNgContent: boolean) => set({ showNgContent }),

      hideThread: (id: number) =>
        set((s: NgState) => ({
          hiddenThreadIds: s.hiddenThreadIds.includes(id)
            ? s.hiddenThreadIds
            : [...s.hiddenThreadIds, id],
        })),

      unhideThread: (id: number) =>
        set((s: NgState) => ({
          hiddenThreadIds: s.hiddenThreadIds.filter((i) => i !== id),
        })),

      addNgDisplayId: (displayId: string) =>
        set((s: NgState) => ({
          ngDisplayIds: s.ngDisplayIds.includes(displayId)
            ? s.ngDisplayIds
            : [...s.ngDisplayIds, displayId],
        })),

      removeNgDisplayId: (displayId: string) =>
        set((s: NgState) => ({
          ngDisplayIds: s.ngDisplayIds.filter((d) => d !== displayId),
        })),

      addNgTitle: (title: string) =>
        set((s: NgState) => ({
          ngTitles: s.ngTitles.includes(title)
            ? s.ngTitles
            : [...s.ngTitles, title],
        })),

      removeNgTitle: (title: string) =>
        set((s: NgState) => ({
          ngTitles: s.ngTitles.filter((t) => t !== title),
        })),

      addNgWord: (word: string) =>
        set((s: NgState) => ({
          ngWords: s.ngWords.includes(word) ? s.ngWords : [...s.ngWords, word],
        })),

      removeNgWord: (word: string) =>
        set((s: NgState) => ({
          ngWords: s.ngWords.filter((w) => w !== word),
        })),

      addNgRegex: (regex: string) => {
        try {
          new RegExp(regex);
        } catch {
          return;
        }
        set((s: NgState) => ({
          ngRegexes: s.ngRegexes.includes(regex)
            ? s.ngRegexes
            : [...s.ngRegexes, regex],
        }));
      },

      removeNgRegex: (regex: string) =>
        set((s: NgState) => ({
          ngRegexes: s.ngRegexes.filter((r) => r !== regex),
        })),

      addNgImage: (input: string) => {
        const bits = /^[01]{64}$/.test(input) ? input : decodeNgHash(input);
        if (!bits) return;
        set((s: NgState) => ({
          ngImages: s.ngImages.includes(bits)
            ? s.ngImages
            : [...s.ngImages, bits],
        }));
      },

      removeNgImage: (bits: string) =>
        set((s: NgState) => ({
          ngImages: s.ngImages.filter((b) => b !== bits),
        })),

      isThreadHidden: (thread: Thread) => {
        const state = get();
        if (!state.enabled) return false;
        if (state.hiddenThreadIds.includes(thread.id)) return true;

        const title = getThreadTitle(thread);
        const body = thread.body.replace(/<[^>]+>/g, "");
        const text = `${title} ${body}`;

        for (const ng of state.ngTitles) {
          if (title.includes(ng)) return true;
        }

        for (const ng of state.ngWords) {
          if (text.includes(ng)) return true;
        }

        for (const pattern of state.ngRegexes) {
          try {
            if (new RegExp(pattern).test(text)) return true;
          } catch {
            // Invalid regex, skip
          }
        }

        // 画像NGチェック
        if (state.ngImages.length > 0 && thread.attachment?.ng_hash) {
          if (isNgImageMatch(state.ngImages, thread.attachment.ng_hash))
            return true;
        }

        return false;
      },

      isPostHidden: (post: Post) => {
        const state = get();
        if (!state.enabled) return false;

        const joinedBody = post.plainBody;

        // display_idでチェック
        if (post.display_id && state.ngDisplayIds.includes(post.display_id)) {
          return true;
        }

        for (const ng of state.ngWords) {
          if (joinedBody.includes(ng)) return true;
        }

        for (const pattern of state.ngRegexes) {
          try {
            if (new RegExp(pattern).test(joinedBody)) return true;
          } catch {
            // Invalid regex, skip
          }
        }

        // 画像NGチェック
        if (state.ngImages.length > 0 && post.attachment?.ng_hash) {
          if (isNgImageMatch(state.ngImages, post.attachment.ng_hash))
            return true;
        }

        return false;
      },

      clearAllNgSettings: () =>
        set({
          enabled: true,
          showNgContent: false,
          hiddenThreadIds: [],
          ngDisplayIds: [],
          ngTitles: [],
          ngWords: [],
          ngRegexes: [],
          ngImages: [],
        }),
    }),
    {
      name: "aimg-ng-settings",
    },
  ),
);
// ─── ユーティリティ関数 ───

/** URL-safe Base64 → 64桁ビット文字列 */
function decodeNgHash(base64: string): string | null {
  const std = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = std + "=".repeat((4 - (std.length % 4)) % 4);
  let bin: string;
  try {
    bin = atob(padded);
  } catch {
    return null;
  }
  let bits = "";
  for (let i = 0; i < bin.length; i++) {
    bits += bin.charCodeAt(i).toString(2).padStart(8, "0");
  }
  return bits.length >= 64 ? bits.slice(0, 64) : null;
}

/** 64桁ビット文字列 → URL-safe Base64（UI表示用） */
export function encodeNgHash(bits: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < 64; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  const std = btoa(String.fromCharCode(...bytes));
  return std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** ngImages（ビット文字列配列）と attachment.ng_hash（Base64）を比較 */
function isNgImageMatch(ngBitsList: string[], base64Hash: string): boolean {
  const bits = decodeNgHash(base64Hash);
  if (!bits) return false;
  for (const ng of ngBitsList) {
    let match = 0;
    for (let i = 0; i < 64; i++) {
      if (bits[i] === ng[i]) match++;
    }
    if (match >= 61) return true;
  }
  return false;
}
