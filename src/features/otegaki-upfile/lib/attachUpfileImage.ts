/**
 * upfile-input-v2 の出力(添付ファイル)を取り出して送信データに載せ替える。
 *
 * 動作前提: handleSubmit が `aimg:prepare-submit` イベントを dispatch して
 * ライブラリ側の `prepareSubmit` を待ったあとに呼ぶこと。これによりはっちゃんの
 * baseform (base64 APNG) や canvas が `<input type="file" name="upfile">` 内の
 * File に変換済みの状態になる。
 * @param form 設定元フォーム
 * @param data 設定先送信データ
 * @returns `true` if the upfile is attached, otherwise `false`.
 */
export function attachUpfileImage(
  _form: HTMLFormElement,
  data: FormData,
): boolean {
  const file = data.get("upfile");
  data.delete("upfile");
  if (!(file instanceof File) || file.size === 0) {
    return false;
  }
  data.append("image", file);
  return true;
}
