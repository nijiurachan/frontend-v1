import {
  create,
  type Mutate,
  type StoreApi,
  type UseBoundStore,
} from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import type { Post } from "@/entities/post";
import type { Thread } from "@/entities/thread";
import { getThreadTitle } from "@/entities/thread";
import { migrateThreadIdArray } from "@/shared/lib/threadIdMigration";

export const IMAGE_NG_SIMILARITY_THRESHOLD = 0.95;
const LEGACY_IMAGE_NG_STORAGE_KEY = "futaba_image_ng";
const NG_STORE_VERSION = 2;

export interface NgImageEntry {
  hash: string;
  addedAt: number;
  note: string;
}

export interface NgImageAddResult {
  success: boolean;
  message: string;
}

export interface NgState {
  enabled: boolean;
  showNgContent: boolean;
  hiddenThreadIds: string[];
  ngDisplayIds: string[];
  ngTitles: string[];
  ngWords: string[];
  ngRegexes: string[];
  ngImages: NgImageEntry[];
  legacyImageNgMigrated: boolean;

  setEnabled: (enabled: boolean) => void;
  setShowNgContent: (show: boolean) => void;
  hideThread: (id: string) => void;
  unhideThread: (id: string) => void;
  addNgDisplayId: (displayId: string) => void;
  removeNgDisplayId: (displayId: string) => void;
  addNgTitle: (title: string) => void;
  removeNgTitle: (title: string) => void;
  addNgWord: (word: string) => void;
  removeNgWord: (word: string) => void;
  addNgRegex: (regex: string) => void;
  removeNgRegex: (regex: string) => void;
  addNgImage: (input: string, note?: string) => NgImageAddResult;
  removeNgImage: (bits: string) => void;
  clearNgImages: () => void;

  isThreadHidden: (thread: Thread) => boolean;
  isPostHidden: (post: Post) => boolean;
  clearAllNgSettings: () => void;
}

// ─── 外部から呼び出し可能なヘルパー関数 ───
// NG処理本体 useNgStore
export type NgStore = UseBoundStore<
  Mutate<StoreApi<NgState>, [["zustand/persist", unknown]]>
>;

type NgStoreApi = Mutate<StoreApi<NgState>, [["zustand/persist", unknown]]>;

export function createNgStore(storage?: StateStorage): NgStore {
  let storeApi: NgStoreApi | undefined;
  let legacyMigrationStarted = false;
  const jsonStorage = storage ? createJSONStorage(() => storage) : undefined;

  return create<NgState>()(
    persist(
      (set, get, api) => {
        storeApi = api;
        return {
          enabled: true,
          showNgContent: false,
          hiddenThreadIds: [],
          ngDisplayIds: [],
          ngTitles: [],
          ngWords: [],
          ngRegexes: [],
          ngImages: [],
          legacyImageNgMigrated: false,

          setEnabled: (enabled: boolean) => set({ enabled }),
          setShowNgContent: (showNgContent: boolean) => set({ showNgContent }),

          hideThread: (id: string) =>
            set((s: NgState) => ({
              hiddenThreadIds: s.hiddenThreadIds.includes(id)
                ? s.hiddenThreadIds
                : [...s.hiddenThreadIds, id],
            })),

          unhideThread: (id: string) =>
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
              ngWords: s.ngWords.includes(word)
                ? s.ngWords
                : [...s.ngWords, word],
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

          addNgImage: (input: string, note: string = "") => {
            const bits = /^[01]{64}$/.test(input) ? input : decodeNgHash(input);
            if (!bits) {
              return {
                success: false,
                message: "画像ハッシュが取得できませんでした",
              };
            }
            if (
              get().ngImages.some((entry) => isSimilarHash(entry.hash, bits))
            ) {
              return {
                success: false,
                message: "既に類似の画像がNGに登録されています",
              };
            }
            set((s: NgState) => ({
              ngImages: [
                ...s.ngImages,
                { hash: bits, addedAt: Date.now(), note: note.trim() },
              ],
            }));
            return { success: true, message: "画像をNGに追加しました" };
          },

          removeNgImage: (bits: string) =>
            set((s: NgState) => ({
              ngImages: s.ngImages.filter((entry) => entry.hash !== bits),
            })),

          clearNgImages: () => set({ ngImages: [] }),

          isThreadHidden: (thread: Thread) => {
            const state = get();
            if (!state.enabled) return false;
            if (state.hiddenThreadIds.includes(thread.id)) return true;

            const title = getThreadTitle(thread);
            const body = thread.opPost.body;
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

            if (
              isNgAttachment(thread.opPost.attachment?.ngHash, state.ngImages)
            ) {
              return true;
            }

            return false;
          },

          isPostHidden: (post: Post) => {
            const state = get();
            if (!state.enabled) return false;

            const joinedBody = post.body;

            // displayIdでチェック
            if (post.displayId && state.ngDisplayIds.includes(post.displayId)) {
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

            if (isNgAttachment(post.attachment?.ngHash, state.ngImages)) {
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
        };
      },
      {
        name: "aimg-ng-settings",
        version: NG_STORE_VERSION,
        ...(jsonStorage ? { storage: jsonStorage } : {}),
        migrate: migrateNgState,
        onRehydrateStorage:
          () => (state: NgState | undefined, error: unknown) => {
            if (
              error ||
              !state ||
              state.legacyImageNgMigrated ||
              legacyMigrationStarted
            ) {
              return;
            }
            legacyMigrationStarted = true;

            const persistStorage = storeApi?.persist.getOptions().storage;
            if (!persistStorage) return;

            try {
              const legacyValue = persistStorage.getItem(
                LEGACY_IMAGE_NG_STORAGE_KEY,
              );
              if (legacyValue instanceof Promise) {
                void legacyValue.then(
                  (value) => completeLegacyImageNgMigration(storeApi, value),
                  () => completeLegacyImageNgMigration(storeApi, undefined),
                );
                return;
              }
              completeLegacyImageNgMigration(storeApi, legacyValue);
            } catch {
              completeLegacyImageNgMigration(storeApi, undefined);
            }
          },
      },
    ),
  );
}

export const useNgStore: NgStore = createNgStore();
// ─── ユーティリティ関数 ───

/** URL-safe Base64 → 64桁ビット文字列 */
export function decodeNgHash(base64: string): string | null {
  if (!/^[A-Za-z0-9_-]{11}$/.test(base64)) return null;
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
  return bits.length === 64 && encodeNgHash(bits) === base64 ? bits : null;
}

export function computeNgHashSimilarity(left: string, right: string): number {
  if (!/^[01]{64}$/.test(left) || !/^[01]{64}$/.test(right)) return 0;
  let same = 0;
  for (let index = 0; index < 64; index += 1) {
    if (left[index] === right[index]) same += 1;
  }
  return same / 64;
}

function isSimilarHash(left: string, right: string): boolean {
  return computeNgHashSimilarity(left, right) >= IMAGE_NG_SIMILARITY_THRESHOLD;
}

function isNgAttachment(
  publicHash: string | null | undefined,
  entries: NgImageEntry[],
): boolean {
  if (!publicHash) return false;
  const bits = decodeNgHash(publicHash);
  return (
    bits !== null && entries.some((entry) => isSimilarHash(entry.hash, bits))
  );
}

export function migrateNgState(persisted: unknown, version: number): unknown {
  const withThreadIds = migrateThreadIdArray(
    persisted,
    version,
    1,
    "hiddenThreadIds",
  );
  if (version >= 2 || !isRecord(withThreadIds)) return withThreadIds;
  const ngImages = Array.isArray(withThreadIds.ngImages)
    ? withThreadIds.ngImages.flatMap(normalizePersistedNgImage)
    : [];
  return { ...withThreadIds, ngImages };
}

function completeLegacyImageNgMigration(
  storeApi: NgStoreApi | undefined,
  legacyValue: unknown,
): void {
  if (!storeApi) return;
  const currentState = storeApi.getState();
  const legacyImages = normalizeLegacyNgImages(legacyValue);
  const ngImages = mergeNgImages(currentState.ngImages, legacyImages);
  storeApi.setState({ ngImages, legacyImageNgMigrated: true });
}

function normalizeLegacyNgImages(value: unknown): NgImageEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.hash !== "string" ||
      !/^[01]{64}$/.test(entry.hash) ||
      typeof entry.addedAt !== "number" ||
      !Number.isFinite(entry.addedAt) ||
      typeof entry.note !== "string"
    ) {
      return [];
    }
    return [
      {
        hash: entry.hash,
        addedAt: entry.addedAt,
        note: entry.note,
      },
    ];
  });
}

function mergeNgImages(
  existingImages: NgImageEntry[],
  legacyImages: NgImageEntry[],
): NgImageEntry[] {
  const mergedImages = [...existingImages];
  for (const legacyImage of legacyImages) {
    if (
      !mergedImages.some((existingImage) =>
        isSimilarHash(existingImage.hash, legacyImage.hash),
      )
    ) {
      mergedImages.push(legacyImage);
    }
  }
  return mergedImages;
}

function normalizePersistedNgImage(value: unknown): NgImageEntry[] {
  if (typeof value === "string" && /^[01]{64}$/.test(value)) {
    return [{ hash: value, addedAt: 0, note: "" }];
  }
  if (!isRecord(value) || typeof value.hash !== "string") return [];
  const hash = /^[01]{64}$/.test(value.hash)
    ? value.hash
    : decodeNgHash(value.hash);
  if (!hash) return [];
  return [
    {
      hash,
      addedAt:
        typeof value.addedAt === "number" && Number.isFinite(value.addedAt)
          ? value.addedAt
          : 0,
      note: typeof value.note === "string" ? value.note : "",
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
