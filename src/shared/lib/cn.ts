import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * clsxとtailwind-mergeを組み合わせたユーティリティ関数
 * Tailwindクラスの競合を適切に解決しながら、条件付きクラスも扱える
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
