/**
 * presign API に送る添付ファイルのバイト列を読み込む。
 * サイズ上限はサーバーの可変設定に従い、presign の応答で判定する。
 */
export async function readAttachmentForUpload(
  file: Pick<File, "arrayBuffer" | "size">,
): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
