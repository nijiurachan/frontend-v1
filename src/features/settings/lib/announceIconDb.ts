/**
 * 運営告知バナー用アップロードアイコンの IndexedDB ラッパ。
 * Blob をそのまま保存し、表示時に `URL.createObjectURL` で取り出す。
 */

const DB_NAME = "aimg-announce-icons";
const STORE = "icons";
const VERSION = 1;

/** 保存されたアイコン1件 */
export interface AnnounceIcon {
  id: number;
  blob: Blob;
  addedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (): void => {
      req.result.createObjectStore(STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = (): void => resolve(req.result);
    req.onerror = (): void => reject(req.error);
  });
  return dbPromise;
}

/** 追加日昇順で全件返す */
export async function listAnnounceIcons(): Promise<AnnounceIcon[]> {
  const db = await openDb();
  return new Promise<AnnounceIcon[]>((resolve, reject) => {
    const req = db
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .getAll();
    req.onsuccess = (): void => {
      const rows = req.result as AnnounceIcon[];
      rows.sort((a, b) => a.addedAt - b.addedAt);
      resolve(rows);
    };
    req.onerror = (): void => reject(req.error);
  });
}

/** 追加。返り値は採番された id */
export async function addAnnounceIcon(blob: Blob): Promise<number> {
  const db = await openDb();
  return new Promise<number>((resolve, reject) => {
    const req = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .add({ blob, addedAt: Date.now() });
    req.onsuccess = (): void => resolve(req.result as number);
    req.onerror = (): void => reject(req.error);
  });
}

/** 指定 id を削除 */
export async function removeAnnounceIcon(id: number): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const req = db
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(id);
    req.onsuccess = (): void => resolve();
    req.onerror = (): void => reject(req.error);
  });
}
