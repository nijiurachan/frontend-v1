/**
 * upfile-input-v2 の出力(添付ファイル)を取り出して送信データに載せ替える。
 *
 * 動作前提: handleSubmit が `aimg:prepare-submit` イベントを dispatch して
 * ライブラリ側の `prepareSubmit` を待ったあとに呼ぶこと。これによりはっちゃんの
 * baseform (base64 APNG) や canvas が `<input type="file" name="upfile">` 内の
 * File に変換済みの状態になる。
 * @param form 設定元フォーム
 * @returns 送信対象の File。添付が無い場合は null。
 */
export function attachUpfileImage(form: HTMLFormElement): File | null {
  const file = new FormData(form).get("upfile");
  return file instanceof File && file.size > 0 ? file : null;
}

export const getAttachedFile: typeof attachUpfileImage = attachUpfileImage;

/** Clear the embedded upfile value and notify it after a successful submit. */
export function notifyUpfileSubmitted(form: HTMLFormElement): void {
  const host = form.querySelector?.("upfile-input-v2") as
    | (HTMLElement & { clickClear?: () => void })
    | null;
  host?.clickClear?.();
  form.dispatchEvent(new CustomEvent("aimg:submitted"));
}
