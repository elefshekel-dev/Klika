// פעולות על הקלטות אודיו של פתקים קוליים. מקומי בלבד — לא מסתנכרן.

import { db } from './db';
import type { Recording } from './types';
import { getDeviceId } from '@/lib/device';

/** שומר הקלטה עבור רסיס (מזהה ההקלטה זהה למזהה הרסיס). */
export async function saveRecording(
  fragmentId: string,
  blob: Blob,
  mimeType: string,
  durationMs: number,
): Promise<void> {
  const recording: Recording = {
    id: fragmentId,
    blob,
    mimeType,
    durationMs,
    createdAt: Date.now(),
    deviceId: getDeviceId(),
  };
  await db.recordings.put(recording);
}

export async function getRecording(fragmentId: string): Promise<Recording | undefined> {
  return db.recordings.get(fragmentId);
}

export async function hasRecording(fragmentId: string): Promise<boolean> {
  return (await db.recordings.where('id').equals(fragmentId).count()) > 0;
}

export async function deleteRecording(fragmentId: string): Promise<void> {
  await db.recordings.delete(fragmentId);
}
