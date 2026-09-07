// אימות מול Google דרך Google Identity Services (GIS), בצד הלקוח בלבד.
// Scope: drive.file בלבד — האפליקציה ניגשת רק לקבצים שהיא עצמה יצרה.
// אין backend, אין סוד לקוח. אין refresh token — מבקשים access token מחדש
// בשקט כשצריך (GIS מחדש בשקט אם המשתמשת כבר אישרה ויש session פעיל).

/* eslint-disable @typescript-eslint/no-explicit-any */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CONNECTED_KEY = 'resisim.drive.connected';

let gisPromise: Promise<void> | null = null;
let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiry = 0;

/** האם הוגדר מזהה לקוח (אחרת הסנכרון לא זמין). */
export function isConfigured(): boolean {
  return CLIENT_ID.trim().length > 0;
}

/** האם המשתמשת בחרה לחבר את Drive (opt-in נשמר מקומית). */
export function isConnected(): boolean {
  try {
    return localStorage.getItem(CONNECTED_KEY) === '1';
  } catch {
    return false;
  }
}

function setConnected(v: boolean) {
  try {
    if (v) localStorage.setItem(CONNECTED_KEY, '1');
    else localStorage.removeItem(CONNECTED_KEY);
  } catch {
    /* מתעלמים */
  }
}

/** טוען את סקריפט GIS פעם אחת. */
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('טעינת Google נכשלה — בדקי חיבור לרשת'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

function ensureTokenClient(): any {
  if (tokenClient) return tokenClient;
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: () => {
      /* מוחלף דינמית בכל בקשה */
    },
  });
  return tokenClient;
}

/**
 * מחזיר access token תקף. interactive=true פותח חלון הרשאה (לחיבור ראשוני);
 * interactive=false מנסה חידוש שקט (לסנכרון אוטומטי).
 */
export async function getToken(interactive: boolean): Promise<string> {
  if (!isConfigured()) throw new Error('לא הוגדר מזהה לקוח של Google');
  // טוקן בזיכרון עדיין תקף (עם שוליים של דקה).
  if (accessToken && Date.now() < tokenExpiry - 60_000) return accessToken;

  await loadGis();
  const client = ensureTokenClient();

  return new Promise<string>((resolve, reject) => {
    client.callback = (resp: any) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      accessToken = resp.access_token;
      tokenExpiry = Date.now() + (resp.expires_in ?? 3600) * 1000;
      setConnected(true);
      resolve(resp.access_token);
    };
    try {
      client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    } catch (e) {
      reject(e as Error);
    }
  });
}

/** חיבור יזום — פותח הרשאה ומסמן כמחובר. */
export async function connect(): Promise<void> {
  await getToken(true);
}

/** ניתוק — שוכח את הטוקן ואת סימון החיבור. הנתונים המקומיים נשארים. */
export function disconnect(): void {
  const token = accessToken;
  accessToken = null;
  tokenExpiry = 0;
  setConnected(false);
  if (token && (window as any).google?.accounts?.oauth2) {
    try {
      (window as any).google.accounts.oauth2.revoke(token);
    } catch {
      /* מתעלמים */
    }
  }
}
