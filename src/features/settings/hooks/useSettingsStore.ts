import { type Context, createContext, useContext } from "react";
import { type StoreApi, useStore } from "zustand";
import type { SettingsStore } from "@/features/settings/stores";

/** 表示設定を持つコンテキスト */
export const SettingsStoreContext: Context<StoreApi<SettingsStore> | null> =
  createContext<StoreApi<SettingsStore> | null>(null);

/** 表示設定を読み込むフック */
export function useSettingsStore(): SettingsStore;
export function useSettingsStore<T>(selector: (store: SettingsStore) => T): T;
export function useSettingsStore<T>(selector?: (store: SettingsStore) => T): T {
  const store = useContext(SettingsStoreContext);
  if (!store) {
    throw new Error("no SettingsStoreContext provided");
  }

  return useStore(store, selector as (store: SettingsStore) => T);
}
