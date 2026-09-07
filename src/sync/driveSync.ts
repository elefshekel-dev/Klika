// מנוע הסנכרון ל-Google Drive. מתזמר: אימות, מיזוג תלת-כיווני, כתיבת
// fragments-data.json (מקור האמת), וקובצי ה-md הקריאים. אוטומטי כל 5 דקות
// בחיבור + כפתור ידני. לעולם לא דורס — קונפליקטים נשמרים כעותקים ומדווחים.

import { getToken, isConfigured, isConnected } from './googleAuth';
import {
  findOrCreateFolder,
  listChildren,
  uploadFile,
  getFileText,
  deleteFile,
  type DriveFile,
} from './googleDrive';
import { mergeSnapshots } from './merge';
import { buildSnapshot, emptySnapshot, applyMerge, snapshotFromMerge } from './snapshot';
import {
  fragmentFileName,
  fragmentMarkdown,
  collectionFileName,
  collectionMarkdown,
} from './markdown';
import { getDeviceId } from '@/lib/device';
import type { BaseMap, Snapshot, SyncState } from './types';

const FOLDER_NAME = 'רסיסים';
const DATA_FILE = 'fragments-data.json';
const BASE_KEY = 'resisim.syncBase';
const FILEMAP_KEY = 'resisim.driveFiles';
const LASTSYNC_KEY = 'resisim.lastSyncAt';
const AUTO_INTERVAL = 5 * 60 * 1000; // 5 דקות

// מיפוי מזהה ישות → מזהה קובץ ה-md ב-Drive (כדי לעדכן/למחוק במקום ליצור כפילויות).
interface FileMap {
  fragments: Record<string, string>;
  collections: Record<string, string>;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* מתעלמים */
  }
}

class SyncManager {
  private state: SyncState = { status: 'disabled' };
  private listeners = new Set<(s: SyncState) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor() {
    if (!isConfigured()) this.state = { status: 'unconfigured' };
    else if (isConnected()) this.state = { status: 'idle', lastSyncAt: this.lastSyncAt() };
    else this.state = { status: 'disabled' };
  }

  getState(): SyncState {
    return this.state;
  }

  subscribe(fn: (s: SyncState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private set(state: SyncState) {
    this.state = state;
    for (const fn of this.listeners) fn(state);
  }

  private lastSyncAt(): number | undefined {
    const v = loadJSON<number>(LASTSYNC_KEY, 0);
    return v || undefined;
  }

  /** מפעיל תזמון אוטומטי (בעליית האפליקציה אם כבר מחוברים). */
  startAuto() {
    if (!isConfigured() || !isConnected()) return;
    this.stopAuto();
    this.timer = setInterval(() => {
      if (navigator.onLine) void this.syncNow(false);
    }, AUTO_INTERVAL);
    // סנכרון ראשוני מיד (בשקט).
    if (navigator.onLine) void this.syncNow(false);
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** ריצת הסנכרון. interactive=true פותח הרשאה במידת הצורך. */
  async syncNow(interactive: boolean): Promise<void> {
    if (!isConfigured()) {
      this.set({ status: 'unconfigured' });
      return;
    }
    if (this.running) return;
    this.running = true;
    this.set({ status: 'syncing' });

    try {
      const token = await getToken(interactive);
      const root = await findOrCreateFolder(token, FOLDER_NAME);
      const rootFiles = await listChildren(token, root);

      // מצב מרוחק.
      const dataFile = rootFiles.find((f) => f.name === DATA_FILE);
      const remote: Snapshot = dataFile
        ? (JSON.parse(await getFileText(token, dataFile.id)) as Snapshot)
        : emptySnapshot();

      const local = await buildSnapshot();
      const baseBefore = loadJSON<BaseMap>(BASE_KEY, {});

      // מיזוג תלת-כיווני.
      const result = mergeSnapshots(local, remote, baseBefore, getDeviceId());

      // כתיבת התוצאה מקומית והעלאתה כמקור אמת.
      await applyMerge(result);
      const mergedSnapshot = snapshotFromMerge(result);
      await uploadFile(token, {
        name: DATA_FILE,
        parentId: root,
        mimeType: 'application/json',
        content: JSON.stringify(mergedSnapshot),
        fileId: dataFile?.id,
      });

      saveJSON(BASE_KEY, result.base);

      // קובצי ה-md הקריאים — רק מה שהשתנה, כדי לחסוך קריאות.
      await this.syncMarkdown(token, root, rootFiles, result, baseBefore);

      const now = Date.now();
      saveJSON(LASTSYNC_KEY, now);

      if (result.conflicts.length > 0) {
        this.set({ status: 'conflict', count: result.conflicts.length, lastSyncAt: now });
      } else {
        this.set({ status: 'idle', lastSyncAt: now });
      }
    } catch (e) {
      this.set({ status: 'error', message: (e as Error).message });
    } finally {
      this.running = false;
    }
  }

  /** מעדכן קובצי md לרסיסים ולאסופות שהשתנו; מוחק md של רסיסים שנמחקו. */
  private async syncMarkdown(
    token: string,
    root: string,
    rootFiles: DriveFile[],
    result: ReturnType<typeof mergeSnapshots>,
    baseBefore: BaseMap,
  ) {
    const fileMap = loadJSON<FileMap>(FILEMAP_KEY, { fragments: {}, collections: {} });

    const fragFolder =
      rootFiles.find((f) => f.name === 'fragments')?.id ??
      (await findOrCreateFolder(token, 'fragments', root));
    const colFolder =
      rootFiles.find((f) => f.name === 'collections')?.id ??
      (await findOrCreateFolder(token, 'collections', root));

    const byId = new Map(result.fragments.map((f) => [f.id, f]));

    // רסיסים: עדכון מה שהשתנה, מחיקת md של מחוקים.
    for (const f of result.fragments) {
      const changed = f.updatedAt > (baseBefore[f.id] ?? 0);
      const existingId = fileMap.fragments[f.id];
      if (f.isDeleted) {
        if (existingId) {
          try {
            await deleteFile(token, existingId);
          } catch {
            /* אולי כבר נמחק */
          }
          delete fileMap.fragments[f.id];
        }
        continue;
      }
      if (!changed && existingId) continue;
      if (!f.content.trim()) continue;
      const id = await uploadFile(token, {
        name: fragmentFileName(f),
        parentId: fragFolder,
        mimeType: 'text/markdown',
        content: fragmentMarkdown(f),
        fileId: existingId,
      });
      fileMap.fragments[f.id] = id;
    }

    // אסופות: קובץ מאוחד לכל אסופה שהשתנתה.
    for (const c of result.collections) {
      const changed = c.updatedAt > (baseBefore[c.id] ?? 0);
      const existingId = fileMap.collections[c.id];
      if (c.isDeleted) {
        if (existingId) {
          try {
            await deleteFile(token, existingId);
          } catch {
            /* אולי כבר נמחק */
          }
          delete fileMap.collections[c.id];
        }
        continue;
      }
      if (!changed && existingId) continue;
      const frags = c.fragmentIds
        .map((fid) => byId.get(fid))
        .filter((x): x is NonNullable<typeof x> => !!x);
      const id = await uploadFile(token, {
        name: collectionFileName(c),
        parentId: colFolder,
        mimeType: 'text/markdown',
        content: collectionMarkdown(c, frags),
        fileId: existingId,
      });
      fileMap.collections[c.id] = id;
    }

    saveJSON(FILEMAP_KEY, fileMap);
  }
}

export const sync = new SyncManager();
