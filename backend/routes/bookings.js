const express = require('express');
const router = express.Router();
const db = require('../db');

router.use((req, res, next) => {
  const authenticate = req.app.get('authenticate');
  authenticate(req, res, next);
});

// GET /api/bookings
router.get('/', (req, res) => {
  const { status, room_id, date } = req.query;
  let query;
  let params = [];

  if (req.user.role === 'manager') {
    query = `
      SELECT b.*, r.name as room_name, u.username
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (room_id) { query += ' AND b.room_id = ?'; params.push(room_id); }
    if (date) { query += ' AND b.date = ?'; params.push(date); }
  } else {
    query = `
      SELECT b.*, r.name as room_name, u.username
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ?
    `;
    params.push(req.user.id);
    if (status) { query += ' AND b.status = ?'; params.push(status); }
  }

  query += ' ORDER BY b.date DESC, b.start_time DESC';

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// POST /api/bookings — auto-approved
router.post('/', (req, res) => {
  const { room_id, booker_name, purpose, participants, date, start_time, end_time } = req.body;

  if (!room_id || !booker_name || !purpose || !participants || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'כל השדות נדרשים' });
  }

  const validateHours = req.app.get('validateOperatingHours');
  const hoursError = validateHours(date, start_time, end_time);
  if (hoursError) {
    return res.status(400).json({ error: hoursError });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
  if (!room) return res.status(400).json({ error: 'חדר לא נמצא' });

  if (participants > room.capacity) {
    return res.status(400).json({ error: `מספר המשתתפים חורג מהתפוסה המקסימלית (${room.capacity})` });
  }

  const conflicts = db.prepare(`
    SELECT * FROM bookings
    WHERE room_id = ? AND date = ? AND status != 'rejected'
    AND NOT (end_time <= ? OR start_time >= ?)
  `).all(room_id, date, start_time, end_time);

  if (conflicts.length > 0) {
    return res.status(409).json({ error: 'החדר תפוס בשעות אלו' });
  }

  const result = db.prepare(`
    INSERT INTO bookings (room_id, user_id, booker_name, purpose, participants, date, start_time, end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
  `).run(room_id, req.user.id, booker_name, purpose, participants, date, start_time, end_time);

  const booking = db.prepare(`
    SELECT b.*, r.name as room_name FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(booking);
});

// PATCH /api/bookings/:id — manager edit booking details
router.patch('/:id', (req, res) => {
  const requireManager = req.app.get('requireManager');
  requireManager(req, res, () => {
    const { room_id, booker_name, purpose, participants, date, start_time, end_time, notes } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

    const newRoomId = room_id || booking.room_id;
    const newDate = date || booking.date;
    const newStart = start_time || booking.start_time;
    const newEnd = end_time || booking.end_time;
    const newParticipants = participants || booking.participants;

    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(newRoomId);
    if (!room) return res.status(400).json({ error: 'חדר לא נמצא' });

    if (newParticipants > room.capacity) {
      return res.status(400).json({ error: `מספר המשתתפים חורג מהתפוסה המקסימלית (${room.capacity})` });
    }

    const conflicts = db.prepare(`
      SELECT * FROM bookings
      WHERE room_id = ? AND date = ? AND status != 'rejected' AND id != ?
      AND NOT (end_time <= ? OR start_time >= ?)
    `).all(newRoomId, newDate, req.params.id, newStart, newEnd);

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'החדר תפוס בשעות אלו' });
    }

    db.prepare(`
      UPDATE bookings SET room_id=?, booker_name=?, purpose=?, participants=?,
        date=?, start_time=?, end_time=?, notes=?
      WHERE id=?
    `).run(
      newRoomId,
      booker_name || booking.booker_name,
      purpose || booking.purpose,
      newParticipants,
      newDate, newStart, newEnd,
      notes !== undefined ? notes : booking.notes,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT b.*, r.name as room_name FROM bookings b
      JOIN rooms r ON b.room_id = r.id WHERE b.id = ?
    `).get(req.params.id);

    res.json(updated);
  });
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', (req, res) => {
  const requireManager = req.app.get('requireManager');
  requireManager(req, res, () => {
    const { status, notes } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'סטטוס לא תקין' });
    }

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

    db.prepare('UPDATE bookings SET status = ?, notes = ? WHERE id = ?')
      .run(status, notes || null, req.params.id);

    const updated = db.prepare(`
      SELECT b.*, r.name as room_name FROM bookings b
      JOIN rooms r ON b.room_id = r.id WHERE b.id = ?
    `).get(req.params.id);

    res.json(updated);
  });
});

// DELETE /api/bookings/:id
router.delete('/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

  if (booking.user_id !== req.user.id && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'אין הרשאה לבטל הזמנה זו' });
  }

  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ message: 'הזמנה בוטלה בהצלחה' });
});

module.exports = router;
