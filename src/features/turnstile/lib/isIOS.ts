// iOS / iPadOS 判定。Turnstile mode のデフォルト決定にのみ使用する
// (cookie 未設定の初回起動で iOS は light、それ以外は stable で初期化)。
// 以降のランタイム挙動は mode 値で分岐するため、ここを直接参照することはない。
// (NativeVideoEmbed.tsx に同じ式の duplicate があるが用途が別物のため、
//  ここではモジュール内に閉じて持つ)
export const isIOS: boolean =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
