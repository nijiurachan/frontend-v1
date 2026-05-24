import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import type { Thread } from "@/entities/thread";
import { getThreadTitle } from "@/entities/thread";

interface FavState {
  favWords: string[];
  favRegexes: string[];
  favWords2: string[];
  favRegexes2: string[];

  addFavWord: (word: string) => void;
  removeFavWord: (word: string) => void;
  addFavRegex: (regex: string) => void;
  removeFavRegex: (regex: string) => void;
  addFavWord2: (word: string) => void;
  removeFavWord2: (word: string) => void;
  addFavRegex2: (regex: string) => void;
  removeFavRegex2: (regex: string) => void;

  isThreadFavorite: (thread: Thread) => number;
  clearAllFavSettings: () => void;
}

function matchesAny(text: string, words: string[], regexes: string[]): boolean {
  for (const word of words) {
    if (text.includes(word)) return true;
  }
  for (const pattern of regexes) {
    try {
      if (new RegExp(pattern).test(text)) return true;
    } catch {
      // Invalid regex, skip
    }
  }
  return false;
}

// Fav処理本体 useFavStore（カタログ並び替え専用）
export const useFavStore: UseBoundStore<StoreApi<FavState>> =
  create<FavState>()(
    persist(
      (set, get) => ({
        favWords: [],
        favRegexes: [],
        favWords2: [],
        favRegexes2: [],

        addFavWord: (word: string) =>
          set((s: FavState) => ({
            favWords: s.favWords.includes(word)
              ? s.favWords
              : [...s.favWords, word],
          })),

        removeFavWord: (word: string) =>
          set((s: FavState) => ({
            favWords: s.favWords.filter((w) => w !== word),
          })),

        addFavRegex: (regex: string) => {
          try {
            new RegExp(regex);
          } catch {
            return;
          }
          set((s: FavState) => ({
            favRegexes: s.favRegexes.includes(regex)
              ? s.favRegexes
              : [...s.favRegexes, regex],
          }));
        },

        removeFavRegex: (regex: string) =>
          set((s: FavState) => ({
            favRegexes: s.favRegexes.filter((r) => r !== regex),
          })),

        addFavWord2: (word: string) =>
          set((s: FavState) => ({
            favWords2: s.favWords2.includes(word)
              ? s.favWords2
              : [...s.favWords2, word],
          })),

        removeFavWord2: (word: string) =>
          set((s: FavState) => ({
            favWords2: s.favWords2.filter((w) => w !== word),
          })),

        addFavRegex2: (regex: string) => {
          try {
            new RegExp(regex);
          } catch {
            return;
          }
          set((s: FavState) => ({
            favRegexes2: s.favRegexes2.includes(regex)
              ? s.favRegexes2
              : [...s.favRegexes2, regex],
          }));
        },

        removeFavRegex2: (regex: string) =>
          set((s: FavState) => ({
            favRegexes2: s.favRegexes2.filter((r) => r !== regex),
          })),

        isThreadFavorite: (thread: Thread) => {
          const state = get();
          const hasLv1 =
            state.favWords.length > 0 || state.favRegexes.length > 0;
          const hasLv2 =
            state.favWords2.length > 0 || state.favRegexes2.length > 0;
          if (!hasLv1 && !hasLv2) return 0;

          const title = getThreadTitle(thread);
          const body = thread.body.replace(/<[^>]+>/g, "");
          const text = `${title} ${body}`;

          if (hasLv2 && matchesAny(text, state.favWords2, state.favRegexes2)) {
            return 2;
          }
          if (hasLv1 && matchesAny(text, state.favWords, state.favRegexes)) {
            return 1;
          }
          return 0;
        },

        clearAllFavSettings: () =>
          set({
            favWords: [],
            favRegexes: [],
            favWords2: [],
            favRegexes2: [],
          }),
      }),
      {
        name: "aimg-fav-settings",
      },
    ),
  );
