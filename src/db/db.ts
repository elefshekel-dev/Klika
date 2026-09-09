// מסד הנתונים המקומי (IndexedDB דרך Dexie). Local-first — זהו מקור האמת.
//
// ⚠️ מדיניות מיגרציות קדושה:
// כל שינוי סכמה חייב לעבור דרך db.version(N).stores(...).upgrade(...) חדש,
// עם מיגרציה מפורשת. לעולם אין לשנות סכמה קיימת "במקום" — יש נתונים אמיתיים
// בצד השני של האפליקציה. הוסיפו גרסה חדשה, אל תערכו קיימת.

import Dexie, { type Table } from 'dexie';
import type { Fragment, Tag, Collection, Version, Settings, Recording } from './types';

export class ResisimDB extends Dexie {
  fragments!: Table<Fragment, string>;
  tags!: Table<Tag, string>;
  collections!: Table<Collection, string>;
  versions!: Table<Version, string>;
  settings!: Table<Settings, string>;
  recordings!: Table<Recording, string>;

  constructor() {
    super('resisim');

    // גרסה 1 — הסכמה הראשונית המלאה.
    // האינדקסים נבחרו לפי דפוסי הגישה של הספרייה:
    //   fragments: מיון לפי updatedAt/createdAt, ו-*tagIds (multiEntry)
    //              לסינון לפי תגית.
    //   versions:  [fragmentId+savedAt] כדי לשלוף/לגזום גרסאות לרסיס.
    // הערה: isPinned/isDeleted הם בוליאנים ולכן אינם ניתנים לאינדוקס
    // ב-IndexedDB (בוליאני אינו מפתח חוקי). מסננים אותם ב-JS — ראו queries.ts.
    this.version(1).stores({
      fragments: 'id, updatedAt, createdAt, *tagIds',
      tags: 'id, name, useCount, createdAt',
      collections: 'id, name, createdAt, updatedAt',
      versions: 'id, fragmentId, savedAt, [fragmentId+savedAt]',
      settings: 'id',
    });

    // גרסה 2 — הוספת טבלת הקלטות (פתקים קוליים). זו טבלה חדשה בלבד; אין נתונים
    // קיימים להמיר, לכן ה-upgrade הוא no-op מפורש (מתועד לפי מדיניות המיגרציות).
    // האודיו מקומי למכשיר ואינו מסתנכרן.
    this.version(2)
      .stores({
        fragments: 'id, updatedAt, createdAt, *tagIds',
        tags: 'id, name, useCount, createdAt',
        collections: 'id, name, createdAt, updatedAt',
        versions: 'id, fragmentId, savedAt, [fragmentId+savedAt]',
        settings: 'id',
        recordings: 'id, createdAt',
      })
      .upgrade(async () => {
        // אין מיגרציית נתונים — הטבלה נוצרת ריקה. מוגדר במפורש כדי לעמוד בכלל
        // "כל שינוי סכמה עובר דרך upgrade".
      });

    // גרסאות עתידיות: הוסיפו כאן this.version(3).stores(...).upgrade(...)
    // עם מיגרציה מפורשת. אל תיגעו בגרסאות קיימות.
  }
}

export const db = new ResisimDB();
