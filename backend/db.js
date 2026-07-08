const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

// Turso (libSQL) in production via env vars; local file for development.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:data/booking.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Adapter that mimics the better-sqlite3 API but async, so route code only
// needs `await` added: await db.prepare(sql).get(...) / .all(...) / .run(...)
function prepare(sql) {
  return {
    async get(...params) {
      const r = await client.execute({ sql, args: normalize(params) });
      return r.rows[0];
    },
    async all(...params) {
      const r = await client.execute({ sql, args: normalize(params) });
      return r.rows;
    },
    async run(...params) {
      const r = await client.execute({ sql, args: normalize(params) });
      return { lastInsertRowid: Number(r.lastInsertRowid), changes: r.rowsAffected };
    },
  };
}
function normalize(params) {
  return params.map((p) => (p === undefined ? null : p));
}

const db = { prepare };

db.init = async function init() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee','manager')),
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL REFERENCES rooms(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      booker_name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      participants INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed rooms if empty
  const roomCount = await db.prepare('SELECT COUNT(*) as c FROM rooms').get();
  if (roomCount.c === 0) {
    await db.prepare('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)').run('אולם סדנאות', 60, 'חלל גדול עם ציוד מולטימדיה');
    await db.prepare('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)').run('חדר ישיבות', 15, 'חדר עם לוח ומסך');
    await db.prepare('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)').run('משרד פרטי', 4, 'חדר שקט לפגישות קטנות');
  }

  // Ensure additional rooms exist (idempotent — added on existing databases too)
  const extraRooms = [
    ['עמדת הטענה אופקית', 1, 'עמדת עבודה'],
  ];
  for (const [name, capacity, description] of extraRooms) {
    const exists = await db.prepare('SELECT id FROM rooms WHERE name = ?').get(name);
    if (!exists) {
      await db.prepare('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)').run(name, capacity, description);
    }
  }

  // Seed users if empty
  const userCount = await db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount.c === 0) {
    const managerHash = bcrypt.hashSync('Klika@Admin2024!', 10);
    const employeeHash = bcrypt.hashSync('Klika@User2024!', 10);
    await db.prepare('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)').run('admin', managerHash, 'manager', 'מנהל המערכת');
    await db.prepare('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)').run('employee1', employeeHash, 'employee', 'ישראל ישראלי');
  }

  await seedLunchBreaks();
  await seedSirajBlock();
};

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Seed lunch break bookings Sun-Thu 12:30-13:30 (rolling 90 days).
// Batched into a single round trip so restarts/redeploys stay fast.
async function seedLunchBreaks() {
  const room = await db.prepare("SELECT id FROM rooms WHERE name = 'חדר ישיבות'").get();
  const admin = await db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!room || !admin) return;

  const statements = [
    { sql: `DELETE FROM bookings WHERE purpose='הפסקת צהריים' AND start_time='12:30' AND end_time='13:30'`, args: [] },
  ];

  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow === 5 || dow === 6) continue;
    statements.push({
      sql: `INSERT INTO bookings (room_id, user_id, booker_name, purpose, participants, date, start_time, end_time, status, notes)
            VALUES (?, ?, 'קליקה', 'הפסקת צהריים', 15, ?, '12:30', '13:30', 'approved', 'שמור להפסקת צהריים')`,
      args: [room.id, admin.id, localDateStr(d)],
    });
  }
  await client.batch(statements, 'write');
}

// Block אולם סדנאות for סיראז' from 2026-07-01 to 2026-08-31 (batched).
async function seedSirajBlock() {
  const room = await db.prepare("SELECT id FROM rooms WHERE name = 'אולם סדנאות'").get();
  const admin = await db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!room || !admin) return;

  const statements = [
    { sql: `DELETE FROM bookings WHERE booker_name='סיראז׳' AND room_id=?`, args: [room.id] },
  ];

  const start = new Date('2026-07-01');
  const end = new Date('2026-08-31');
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 6) continue; // שבת סגור
    const endTime = dow === 5 ? '14:00' : '20:00';
    statements.push({
      sql: `INSERT INTO bookings (room_id, user_id, booker_name, purpose, participants, date, start_time, end_time, status, notes)
            VALUES (?, ?, 'סיראז׳', 'סיראז׳', 60, ?, '08:00', ?, 'approved', 'חסום לסיראז׳')`,
      args: [room.id, admin.id, localDateStr(d), endTime],
    });
  }
  await client.batch(statements, 'write');
}

module.exports = db;
