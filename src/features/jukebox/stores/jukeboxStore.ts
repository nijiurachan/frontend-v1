// src/features/jukebox/stores/jukeboxStore.ts
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

interface JukeboxLocalValues {
  volume: number;
  muted: boolean;
}

interface JukeboxLocalActions {
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

type JukeboxLocalState = JukeboxLocalValues & JukeboxLocalActions;

const DEFAULT_VALUES: JukeboxLocalValues = {
  volume: 1,
  muted: false,
};

export const useJukeboxStore: UseBoundStore<StoreApi<JukeboxLocalState>> =
  create<JukeboxLocalState>()(
    persist(
      (set): JukeboxLocalState => ({
        ...DEFAULT_VALUES,
        setVolume: (volume: number): void => {
          set({ volume: Math.max(0, Math.min(1, volume)) });
        },
        setMuted: (muted: boolean): void => {
          set({ muted });
        },
        toggleMuted: (): void => {
          set((s) => ({ muted: !s.muted }));
        },
      }),
      {
        name: "aimg-jukebox-player",
        partialize: (s): JukeboxLocalValues => ({
          volume: s.volume,
          muted: s.muted,
        }),
      },
    ),
  );
