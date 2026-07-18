import type { Post } from "@/entities/post";
import type { ThreadView } from "@/entities/thread";

export function safeFilename(
  value: string,
  fallback: string = "thread",
): string {
  const safe = Array.from(value, (character) =>
    character.charCodeAt(0) < 32 || /[\\/:*?"<>|]/.test(character)
      ? "_"
      : character,
  )
    .join("")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 120);
  return safe || fallback;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const publicPosts = (thread: ThreadView): Post[] =>
  thread.posts.filter((post) => post.status === "public");

export function threadExportBase(thread: ThreadView): string {
  return safeFilename(
    publicPosts(thread)[0]?.body.replace(/\s+/g, " ").slice(0, 30) ||
      `スレッド${thread.id}`,
  );
}

export function createThreadText(thread: ThreadView): string {
  return publicPosts(thread)
    .map(
      (post) =>
        `No.${post.boardNo ?? post.seq}\n${post.body}${post.attachment ? `\n${post.attachment.originalUrl}` : ""}`,
    )
    .join("\n\n");
}

export function createThreadHtml(thread: ThreadView): string {
  const articles = publicPosts(thread)
    .map(
      (post) =>
        `<article><b>No.${post.boardNo ?? post.seq}</b><blockquote>${escapeHtml(post.body).replace(/\n/g, "<br>")}</blockquote>${post.attachment ? `<a href="${escapeHtml(post.attachment.originalUrl)}">添付</a>` : ""}</article>`,
    )
    .join("");
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(threadExportBase(thread))}</title><body>${articles}</body></html>`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = safeFilename(filename);
    anchor.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

interface ZipFile {
  name: string;
  data: Uint8Array;
}

const CRC_TABLE: number[] = Array.from({ length: 256 }, (_, value) => {
  let current = value;
  for (let bit = 0; bit < 8; bit += 1) {
    current =
      (current & 1) !== 0 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }
  return current >>> 0;
});

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data)
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipHeader(size: number): {
  bytes: Uint8Array<ArrayBuffer>;
  view: DataView<ArrayBuffer>;
} {
  const buffer = new ArrayBuffer(size);
  return { bytes: new Uint8Array(buffer), view: new DataView(buffer) };
}

/** Dependency-free, uncompressed ZIP writer used to keep one user download. */
export function createStoredZip(files: ZipFile[]): Blob {
  const encoder = new TextEncoder();
  const localParts: ArrayBuffer[] = [];
  const centralParts: ArrayBuffer[] = [];
  let localOffset = 0;
  let centralSize = 0;

  const ownedBuffer = (value: Uint8Array): ArrayBuffer => {
    const copy = new Uint8Array(value.byteLength);
    copy.set(value);
    return copy.buffer;
  };

  for (const file of files) {
    const name = encoder.encode(file.name);
    const checksum = crc32(file.data);
    const local = zipHeader(30);
    local.view.setUint32(0, 0x04034b50, true);
    local.view.setUint16(4, 20, true);
    local.view.setUint16(6, 0x0800, true);
    local.view.setUint16(12, 0x0021, true);
    local.view.setUint32(14, checksum, true);
    local.view.setUint32(18, file.data.byteLength, true);
    local.view.setUint32(22, file.data.byteLength, true);
    local.view.setUint16(26, name.byteLength, true);
    localParts.push(
      local.bytes.buffer,
      ownedBuffer(name),
      ownedBuffer(file.data),
    );

    const central = zipHeader(46);
    central.view.setUint32(0, 0x02014b50, true);
    central.view.setUint16(4, 20, true);
    central.view.setUint16(6, 20, true);
    central.view.setUint16(8, 0x0800, true);
    central.view.setUint16(14, 0x0021, true);
    central.view.setUint32(16, checksum, true);
    central.view.setUint32(20, file.data.byteLength, true);
    central.view.setUint32(24, file.data.byteLength, true);
    central.view.setUint16(28, name.byteLength, true);
    central.view.setUint32(42, localOffset, true);
    centralParts.push(central.bytes.buffer, ownedBuffer(name));
    centralSize += central.bytes.byteLength + name.byteLength;
    localOffset +=
      local.bytes.byteLength + name.byteLength + file.data.byteLength;
  }

  const end = zipHeader(22);
  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(8, files.length, true);
  end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, localOffset, true);
  return new Blob([...localParts, ...centralParts, end.bytes.buffer], {
    type: "application/zip",
  });
}

function originalUrl(url: string): string {
  const parsed = new URL(url, location.href);
  parsed.searchParams.set("original", "1");
  return parsed.toString();
}

function decodedFilename(pathName: string): string {
  const encoded = pathName.split("/").pop() || "file.bin";
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

export async function downloadAllAttachments(
  thread: ThreadView,
  fetcher: typeof fetch = fetch,
): Promise<string[]> {
  const failures: string[] = [];
  const files: ZipFile[] = [];
  for (const post of publicPosts(thread)) {
    if (!post.attachment) continue;
    const sourceUrl = post.attachment.originalUrl;
    try {
      const response = await fetcher(originalUrl(sourceUrl));
      if (!response.ok) throw new Error(String(response.status));
      const pathName = new URL(sourceUrl, location.href).pathname;
      const originalName = decodedFilename(pathName);
      files.push({
        name: `${String(files.length + 1).padStart(3, "0")}_${safeFilename(originalName, "file.bin")}`,
        data: new Uint8Array(await response.arrayBuffer()),
      });
    } catch {
      failures.push(sourceUrl);
    }
  }
  if (files.length > 0) {
    downloadBlob(
      createStoredZip(files),
      `${threadExportBase(thread)}_files.zip`,
    );
  }
  return failures;
}
