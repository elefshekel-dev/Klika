// זהות המכשיר — מזהה יציב לכל מכשיר, נשמר מקומית.
// משמש להתכנסות סנכרון רב-מכשירי (מי ביצע את העדכון האחרון).

import { newId } from './id';

const KEY = 'resisim.deviceId';

let cached: string | null = null;

export function getDeviceId(): string {
  if (cached) return cached;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(KEY, id);
    }
    cached = id;
    return id;
  } catch {
    // אם localStorage חסום — מזהה זמני לזיכרון בלבד.
    cached = newId();
    return cached;
  }
}
