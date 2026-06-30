const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'booking.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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
const roomCount = db.prepare('SELECT COUNT(*) as c FROM rooms').get();
if (roomCount.c === 0) {
  const insertRoom = db.prepare('INSERT INTO rooms (name, capacity, description) VALUES (?, ?, ?)');
  insertRoom.run('אולם סדנאות', 60, 'חלל גדול עם ציוד מולטימדיה');
  insertRoom.run('חדר ישיבות', 15, 'חדר עם לוח ומסך');
  insertRoom.run('משרד פרטי', 4, 'חדר שקט לפגישות קטנות');
}

// Seed users if empty
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
  const insertUser = db.prepare('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)');
  const managerHash = bcrypt.hashSync('Klika@Admin2024!', 10);
  const employeeHash = bcrypt.hashSync('Klika@User2024!', 10);
  insertUser.run('admin', managerHash, 'manager', 'מנהל המערכת');
  insertUser.run('employee1', employeeHash, 'employee', 'ישראל ישראלי');
}

// Seed lunch break bookings Sun-Thu 12:30-13:30 (rolling 90 days)
function seedLunchBreaks() {
  const room = db.prepare("SELECT id FROM rooms WHERE name = 'חדר ישיבות'").get();
  const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (!room || !admin) return;

  db.prepare(`DELETE FROM bookings WHERE purpose='הפסקת צהריים' AND start_time='12:30' AND end_time='13:30'`).run();

  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    if (dow === 5 || dow === 6) continue;

    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    db.prepare(`
      INSERT INTO bookings (room_id, user_id, booker_name, purpose, participants, date, start_time, end_time, status, notes)
      VALUES (?, ?, 'קליקה', 'הפסקת צהריים', 15, ?, '12:30', '13:30', 'approved', 'שמור להפסקת צהריים')
    `).run(room.id, admin.id, dateStr);
  }
}
seedLunchBreaks();

module.exports = db;
