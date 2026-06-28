const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'room-booking-secret-key-2024';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// JWT middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'נדרשת התחברות' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין' });
  }
}

function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'הרשאת מנהל נדרשת' });
  }
  next();
}

app.set('jwtSecret', JWT_SECRET);
app.set('authenticate', authenticate);
app.set('requireManager', requireManager);

// Operating hours validation helper
function validateOperatingHours(date, startTime, endTime) {
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat

  if (dayOfWeek === 6) {
    return 'אין הזמנות בשבת';
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
  }

  const openMinutes = 8 * 60; // 08:00
  let closeMinutes;

  if (dayOfWeek === 5) {
    // Friday
    closeMinutes = 14 * 60; // 14:00
  } else {
    // Sun-Thu
    closeMinutes = 22 * 60; // 22:00
  }

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    if (dayOfWeek === 5) {
      return 'ביום שישי שעות הפעילות הן 08:00-14:00';
    }
    return 'שעות הפעילות הן 08:00-22:00 (ראשון-חמישי)';
  }

  return null;
}

app.set('validateOperatingHours', validateOperatingHours);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
