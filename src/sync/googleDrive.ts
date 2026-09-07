// לקוח REST מינימלי ל-Google Drive. משתמש ב-access token מ-googleAuth.
// כל הקבצים נוצרים ע"י האפליקציה ולכן נגישים תחת scope drive.file.

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

async function driveFetch(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

/** מחפש תיקייה בשם נתון תחת הורה (או השורש), ויוצר אם אין. מחזיר מזהה. */
export async function findOrCreateFolder(
  token: string,
  name: string,
  parentId?: string,
): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : " and 'root' in parents";
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='${FOLDER_MIME}' and trashed=false${parentClause}`;
  const res = await driveFetch(
    token,
    `${API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`,
  );
  const data = (await res.json()) as { files: DriveFile[] };
  if (data.files.length > 0) return data.files[0].id;

  const create = await driveFetch(token, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: parentId ? [parentId] : undefined,
    }),
  });
  const created = (await create.json()) as { id: string };
  return created.id;
}

/** רשימת הקבצים (לא תיקיות) תחת הורה. */
export async function listChildren(token: string, parentId: string): Promise<DriveFile[]> {
  const q = `'${parentId}' in parents and trashed=false`;
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const url =
      `${API}/files?q=${encodeURIComponent(q)}` +
      `&fields=nextPageToken,files(id,name,modifiedTime)&pageSize=1000&spaces=drive` +
      (pageToken ? `&pageToken=${pageToken}` : '');
    const res = await driveFetch(token, url);
    const data = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
    files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

/** מעלה או מעדכן קובץ טקסט. אם fileId ניתן — עדכון תוכן; אחרת יצירה. */
export async function uploadFile(
  token: string,
  opts: { name: string; parentId?: string; mimeType: string; content: string; fileId?: string },
): Promise<string> {
  const boundary = 'resisim-' + Math.random().toString(36).slice(2);
  const metadata: Record<string, unknown> = { name: opts.name, mimeType: opts.mimeType };
  if (!opts.fileId && opts.parentId) metadata.parents = [opts.parentId];

  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${opts.mimeType}; charset=UTF-8\r\n\r\n` +
    opts.content +
    `\r\n--${boundary}--`;

  const url = opts.fileId
    ? `${UPLOAD}/files/${opts.fileId}?uploadType=multipart&fields=id`
    : `${UPLOAD}/files?uploadType=multipart&fields=id`;

  const res = await driveFetch(token, url, {
    method: opts.fileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** מוריד את תוכן הקובץ כטקסט. */
export async function getFileText(token: string, fileId: string): Promise<string> {
  const res = await driveFetch(token, `${API}/files/${fileId}?alt=media`);
  return res.text();
}

/** מוחק קובץ (למשל md של רסיס שנמחק). */
export async function deleteFile(token: string, fileId: string): Promise<void> {
  await driveFetch(token, `${API}/files/${fileId}`, { method: 'DELETE' });
}
